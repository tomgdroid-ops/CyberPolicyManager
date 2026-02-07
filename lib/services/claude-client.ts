import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ControlMappingResult {
  control_code: string;
  coverage: "full" | "partial" | "none";
  confidence: number;
  reasoning: string;
}

interface GapAnalysisResult {
  control_code: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  remediation: string;
  suggested_policy_type: string;
}

export async function analyzeControlMappings(
  policyText: string,
  policyName: string,
  controls: Array<{ control_code: string; control_title: string; control_description: string }>
): Promise<ControlMappingResult[]> {
  const controlList = controls
    .map((c) => `- ${c.control_code}: ${c.control_title}\n  ${c.control_description}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a cybersecurity compliance analyst. Analyze the following policy document and determine which of the listed framework controls it addresses.

POLICY: "${policyName}"
---
${policyText.substring(0, 15000)}
---

FRAMEWORK CONTROLS:
${controlList}

For each control, determine if the policy addresses it and to what degree. Return a JSON array with the following structure:
[
  {
    "control_code": "XX.YY-NN",
    "coverage": "full" | "partial" | "none",
    "confidence": 0.0 to 1.0,
    "reasoning": "Brief explanation of why this coverage level was assigned"
  }
]

Only include controls where coverage is "full" or "partial" (skip "none"). Be conservative in your assessments - only assign "full" when the policy clearly and completely addresses the control. Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const results: ControlMappingResult[] = JSON.parse(jsonMatch[0]);
    return results.filter((r) => r.coverage !== "none");
  } catch {
    console.error("Failed to parse Claude response:", text.substring(0, 200));
    return [];
  }
}

export async function analyzeGaps(
  unmappedControls: Array<{ control_code: string; control_title: string; control_description: string; category_code: string }>,
  existingPolicies: string[]
): Promise<GapAnalysisResult[]> {
  const controlList = unmappedControls
    .map((c) => `- ${c.control_code} (${c.category_code}): ${c.control_title} - ${c.control_description}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a cybersecurity compliance analyst. The following framework controls are NOT covered by any existing policies. Analyze each gap and provide remediation recommendations.

EXISTING POLICIES: ${existingPolicies.join(", ")}

UNCOVERED CONTROLS:
${controlList}

For each uncovered control, provide:
1. Severity (critical, high, medium, low) based on security impact
2. Description of the gap
3. Remediation recommendation
4. Suggested policy type to create

Return a JSON array:
[
  {
    "control_code": "XX.YY-NN",
    "severity": "critical" | "high" | "medium" | "low",
    "description": "What is missing and why it matters",
    "remediation": "Specific steps to address this gap",
    "suggested_policy_type": "Name of the policy that should address this"
  }
]

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse gap analysis response");
    return [];
  }
}

export async function generateRecommendations(
  gaps: GapAnalysisResult[],
  overallScore: number
): Promise<Array<{ priority: number; title: string; description: string; timeframe: string; related_gaps: string[] }>> {
  const gapSummary = gaps
    .map((g) => `${g.control_code} (${g.severity}): ${g.description}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a cybersecurity compliance advisor. Based on the following compliance gaps (overall score: ${overallScore.toFixed(1)}%), provide prioritized remediation recommendations.

GAPS:
${gapSummary}

Provide 5-10 prioritized recommendations. Return a JSON array:
[
  {
    "priority": 1,
    "title": "Short action title",
    "description": "Detailed recommendation",
    "timeframe": "immediate" | "short_term" | "medium_term" | "long_term",
    "related_gaps": ["XX.YY-NN", ...]
  }
]

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}
