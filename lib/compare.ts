export function buildFitPrompt(jobDescription: string, profile: string, question?: string, taskType: 'compare' | 'email' | 'resume' = 'compare', instructions?: string) {
  if (taskType === 'email') {
    return `You are helping write a strong professional outreach email.

CONTEXT:
${jobDescription}

CANDIDATE BACKGROUND:
${profile || 'No résumé text provided yet.'}

RULES:
${instructions || 'Write a polished email that sounds confident, specific, and concise. Include a clear subject line and body. Keep the tone professional and warm.'}

Return exactly two sections:
Subject: <subject>
Body: <email text>

Keep it under 180 words.`;
  }

  if (taskType === 'resume') {
    return `You are helping turn a candidate background into an excellent résumé draft for a target role.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile || 'No résumé text provided yet.'}

RULES:
${instructions || 'Create a strong résumé summary and 5 impactful bullet points tailored to the role. Emphasize relevance, measurable impact, and leadership where appropriate.'}

Return a polished résumé draft with a short summary and bullet points. Keep it concise and tailored.`;
  }

  return `You are helping a candidate evaluate a job opportunity.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile}

RULES:
${instructions || 'Assess how well this candidate fits this role. Call out strong matches, real gaps, and anything worth clarifying before applying. Be direct and specific, not generic.'}

QUESTION:
${question || 'How strong is this fit?'}

Answer in under 300 words. Be concrete — cite specific parts of the JD and the background, not general encouragement.`;
}
