export function buildFitPrompt(jobDescription: string, profile: string, question?: string) {
  return `You are helping a candidate evaluate a job opportunity.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile}

QUESTION:
${question || 'Assess how well this candidate fits this role. Call out strong matches, real gaps, and anything worth clarifying before applying. Be direct and specific, not generic.'}

Answer in under 300 words. Be concrete — cite specific parts of the JD and the background, not general encouragement.`;
}
