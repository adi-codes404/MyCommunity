/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with named parameters as instructed in gemini-api skill.
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment. Fallback simulation active.');
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Analyzes an image and/or description to categorize and score severity.
 */
export async function categorizeIssue(
  imageBytesBase64?: string,
  description?: string
): Promise<{
  category: string;
  severity: string;
  summary: string;
  issue_type: string;
  is_urgent: boolean;
  suggested_tags: string[];
}> {
  const ai = getAiClient();
  const prompt = `You are an AI assistant for a civic issue reporting platform called My Community.
Analyze this image and/or description of a neighborhood problem.
Return only valid JSON with these fields:
- category: (MUST be one of: "roads", "water", "sanitation", "garbage", "lighting", "drainage", "civic_behavior", "other")
- severity: (MUST be one of: "low", "medium", "high", "critical")
- summary: (one sentence plain English summarizing the issue)
- issue_type: (MUST be "infrastructure" or "civic_behavior")
- is_urgent: (boolean flag)
- suggested_tags: (array of up to 4 tags, e.g. ["pothole", "hazard", "night-safety"])

Return ONLY the JSON. No markdown backticks, no wrap, just the raw JSON text.`;

  // Fallback if API key is not configured or fails
  const fallbackResponse = {
    category: (description?.toLowerCase().includes('water') || description?.toLowerCase().includes('leak')) ? 'water' :
              (description?.toLowerCase().includes('light') || description?.toLowerCase().includes('dark')) ? 'lighting' :
              (description?.toLowerCase().includes('pothole') || description?.toLowerCase().includes('road')) ? 'roads' :
              (description?.toLowerCase().includes('trash') || description?.toLowerCase().includes('garbage')) ? 'garbage' : 'other',
    severity: (description?.toLowerCase().includes('danger') || description?.toLowerCase().includes('emergency')) ? 'critical' : 'medium',
    summary: description || 'Civic issue reported by user requiring neighborhood attention.',
    issue_type: 'infrastructure',
    is_urgent: description?.toLowerCase().includes('danger') || false,
    suggested_tags: ['community-report']
  };

  if (!ai) {
    return fallbackResponse;
  }

  try {
    const parts: any[] = [{ text: prompt }];

    if (imageBytesBase64) {
      // Strip data url prefix if present
      const base64Data = imageBytesBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    if (description) {
      parts.push({ text: `User description: ${description}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const cleanedText = text.trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error calling Gemini API for categorization:', error);
    return fallbackResponse;
  }
}

/**
 * Generates a 2-3 sentence summary of an issue combining user description and community verifications.
 */
export async function generateIssueSummary(
  issueDescription: string,
  verifications: string[]
): Promise<string> {
  const ai = getAiClient();
  const prompt = `You are a helpful community coordinator. Combine the following citizen issue description and community feedback comments into a 2-3 sentence, highly professional, plain-language summary. Highlight the specific issue, current community consensus, and urgent actions required.
  
Description: "${issueDescription}"
Community Feedback:
${verifications.map((v, i) => `${i + 1}. "${v}"`).join('\n')}

Summary (2-3 sentences max):`;

  const fallback = `Community confirmed: "${issueDescription}". Community verifications highlight local disruption requiring urgent municipal inspection.`;

  if (!ai) {
    return fallback;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || fallback;
  } catch (error) {
    console.error('Error generating issue summary:', error);
    return fallback;
  }
}

/**
 * Generates a hotspot warning natural-language analysis for the authority dashboard.
 */
export async function generateHotspotAlert(
  category: string,
  wardName: string,
  issuesCount: number,
  descriptions: string[]
): Promise<string> {
  const ai = getAiClient();
  const prompt = `You are a civic data scientist. An automated hotspot detector has detected a cluster of ${issuesCount} open "${category}" issues in ${wardName} within 500 meters of each other reported in the last 7 days.
Analyze the following reports and write a concise, action-focused 1-paragraph summary warning authorities of the recurring pattern, potential systemic causes (e.g. underlying drainage decay, local construction traffic, seasonal issues), and immediate preventive steps.

Individual Reports:
${descriptions.map((desc, i) => `- ${desc}`).join('\n')}

Action warning (1 paragraph, professional tone, focus-driven):`;

  const fallback = `PREDICTIVE ALERT: Multiple ${category} reports have emerged in a 500-meter zone within ${wardName} in the last 7 days. This indicates an escalating problem cluster (such as underlying infrastructure fatigue or localized dumping). An immediate site visit and localized system sweep are highly recommended to prevent wider grid failure.`;

  if (!ai) {
    return fallback;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || fallback;
  } catch (error) {
    console.error('Error generating hotspot alert:', error);
    return fallback;
  }
}
