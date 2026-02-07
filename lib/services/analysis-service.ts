import { query } from "@/lib/db";
import { analyzeControlMappings, analyzeGaps, generateRecommendations } from "./claude-client";
import { createMapping, deleteAiMappingsForPolicy } from "@/lib/queries/mappings";
import { createNotification } from "@/lib/queries/notifications";
import { CategoryScore } from "@/types/analysis";

const CONTROL_BATCH_SIZE = 20;

export async function runAnalysis(analysisId: string, organizationId: string, frameworkId: string, triggeredBy: string) {
  try {
    // Mark as running
    await query(
      "UPDATE analysis_results SET status = 'running', started_at = now() WHERE id = $1",
      [analysisId]
    );

    // Get all finalized policies with extracted text for this organization
    const policiesResult = await query(
      `SELECT id, policy_name, policy_code, document_content_text
       FROM policies
       WHERE organization_id = $1 AND status = 'finalized' AND document_content_text IS NOT NULL AND document_content_text != ''`,
      [organizationId]
    );
    const policies = policiesResult.rows;

    if (policies.length === 0) {
      await query(
        `UPDATE analysis_results SET status = 'failed', error_message = 'No finalized policies with document text found', completed_at = now() WHERE id = $1`,
        [analysisId]
      );
      return;
    }

    // Get all controls for the framework
    const controlsResult = await query(
      `SELECT fc.id, fc.control_code, fc.control_title, fc.control_description,
              fcat.category_code, fcat.category_name, fcat.id as category_id
       FROM framework_controls fc
       JOIN framework_categories fcat ON fc.category_id = fcat.id
       WHERE fc.framework_id = $1
       ORDER BY fc.sort_order`,
      [frameworkId]
    );
    const allControls = controlsResult.rows;
    const totalControls = allControls.length;

    // For each policy, analyze control mappings
    for (const policy of policies) {
      // Clear previous AI mappings for this policy
      await deleteAiMappingsForPolicy(policy.id, organizationId);

      // Batch controls and send to Claude
      for (let i = 0; i < allControls.length; i += CONTROL_BATCH_SIZE) {
        const batch = allControls.slice(i, i + CONTROL_BATCH_SIZE);
        const controlsForApi = batch.map((c: { control_code: string; control_title: string; control_description: string }) => ({
          control_code: c.control_code,
          control_title: c.control_title,
          control_description: c.control_description || "",
        }));

        try {
          const mappings = await analyzeControlMappings(
            policy.document_content_text,
            policy.policy_name,
            controlsForApi
          );

          // Store AI-suggested mappings
          for (const mapping of mappings) {
            const control = batch.find((c: { control_code: string }) => c.control_code === mapping.control_code);
            if (control) {
              await createMapping(
                organizationId,
                policy.id,
                control.id,
                mapping.coverage,
                mapping.reasoning,
                true,
                mapping.confidence
              );
            }
          }
        } catch (err) {
          console.error(`Failed to analyze batch for policy ${policy.policy_name}:`, err);
        }
      }
    }

    // Compute coverage stats for this organization
    const mappedControlsResult = await query(
      `SELECT DISTINCT pcm.control_id, pcm.coverage
       FROM policy_control_mappings pcm
       JOIN framework_controls fc ON pcm.control_id = fc.id
       WHERE pcm.organization_id = $1 AND fc.framework_id = $2`,
      [organizationId, frameworkId]
    );

    const mappedControls = mappedControlsResult.rows;
    const fullyCovered = new Set<string>();
    const partiallyCovered = new Set<string>();

    for (const m of mappedControls) {
      if (m.coverage === "full") {
        fullyCovered.add(m.control_id);
        partiallyCovered.delete(m.control_id);
      } else if (m.coverage === "partial" && !fullyCovered.has(m.control_id)) {
        partiallyCovered.add(m.control_id);
      }
    }

    const fullyCount = fullyCovered.size;
    const partiallyCount = partiallyCovered.size;
    const notCoveredCount = totalControls - fullyCount - partiallyCount;
    const overallScore = totalControls > 0
      ? ((fullyCount + 0.5 * partiallyCount) / totalControls) * 100
      : 0;

    // Compute per-category scores
    const categoryMap = new Map<string, { code: string; name: string; total: number; full: number; partial: number }>();
    for (const ctrl of allControls) {
      const key = ctrl.category_code;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { code: key, name: ctrl.category_name, total: 0, full: 0, partial: 0 });
      }
      const cat = categoryMap.get(key)!;
      cat.total++;
      if (fullyCovered.has(ctrl.id)) cat.full++;
      else if (partiallyCovered.has(ctrl.id)) cat.partial++;
    }

    const categoryScores: CategoryScore[] = Array.from(categoryMap.values()).map((cat) => ({
      category_code: cat.code,
      category_name: cat.name,
      score: cat.total > 0 ? ((cat.full + 0.5 * cat.partial) / cat.total) * 100 : 0,
      total_controls: cat.total,
      fully_covered: cat.full,
      partially_covered: cat.partial,
      not_covered: cat.total - cat.full - cat.partial,
    }));

    // Find gaps (unmapped controls)
    const coveredControlIds = new Set([...fullyCovered, ...partiallyCovered]);
    const unmappedControls = allControls.filter((c: { id: string }) => !coveredControlIds.has(c.id));

    // Analyze gaps with Claude
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gaps: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recommendations: any[] = [];

    if (unmappedControls.length > 0) {
      try {
        const gapControls = unmappedControls.slice(0, 50).map((c: { control_code: string; control_title: string; control_description: string; category_code: string }) => ({
          control_code: c.control_code,
          control_title: c.control_title,
          control_description: c.control_description || "",
          category_code: c.category_code,
        }));

        const policyNames = policies.map((p: { policy_name: string }) => p.policy_name);
        gaps = await analyzeGaps(gapControls, policyNames);
        recommendations = await generateRecommendations(gaps, overallScore);
      } catch (err) {
        console.error("Gap analysis failed:", err);
      }
    }

    // Store results
    await query(
      `UPDATE analysis_results SET
        status = 'completed',
        total_controls = $1,
        controls_fully_covered = $2,
        controls_partially_covered = $3,
        controls_not_covered = $4,
        overall_score = $5,
        category_scores = $6,
        gaps = $7,
        recommendations = $8,
        completed_at = now()
       WHERE id = $9`,
      [
        totalControls,
        fullyCount,
        partiallyCount,
        notCoveredCount,
        overallScore,
        JSON.stringify(categoryScores),
        JSON.stringify(gaps),
        JSON.stringify(recommendations),
        analysisId,
      ]
    );

    // Notify user
    await createNotification(
      triggeredBy,
      "analysis.completed",
      "Compliance analysis completed",
      `Score: ${overallScore.toFixed(1)}% - ${fullyCount} fully covered, ${partiallyCount} partially covered, ${notCoveredCount} gaps found.`,
      `/compliance/analysis/${analysisId}`
    );
  } catch (error) {
    console.error("Analysis failed:", error);
    await query(
      "UPDATE analysis_results SET status = 'failed', error_message = $1, completed_at = now() WHERE id = $2",
      [error instanceof Error ? error.message : "Unknown error", analysisId]
    );
  }
}
