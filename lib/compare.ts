export function buildFitPrompt(jobDescription: string, profile: string, question?: string, taskType: 'compare' | 'email' | 'resume' = 'compare', instructions?: string) {
  if (taskType === 'email') {
    return `You are helping a job seeker write a strong professional outreach email to a recruiter or hiring contact.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile || 'No résumé text provided yet.'}

RULES:
${instructions || 'Write a polished email that sounds confident, specific, and concise. The email should be from the candidate to the recruiter or hiring contact. Include a clear subject line and body. Keep the tone professional and warm, without sounding overly formal or AI-like.'}

Return exactly two sections:
Subject: <subject>
Body: <email text>

Keep it under 180 words.`;
  }

  if (taskType === 'resume') {
    return `You are acting as a senior recruiter reviewing a candidate's resume against a job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile || 'No résumé text provided yet.'}

RULES:
${instructions || "Review the resume as a recruiter would. Identify the missing keywords and phrasing from the JD without changing the candidate's actual experience or inventing achievements. Suggest a stronger résumé summary and a few improved bullets that preserve the original meaning. Use plain, natural language, avoid AI-style filler, and keep recommendations practical and specific."}

Return a concise recruiter-style review with:
1. Missing keywords or phrases from the JD
2. Resume points that should be preserved as-is
3. A stronger rewritten summary
4. A short list of improved bullets that keep the original facts intact`;
  }

  return `You are acting as a senior recruiter reviewing a candidate's fit for a role.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${profile}

RULES:
${instructions || "Assess how well the resume fits the role. Identify the most important missing keywords from the JD without changing the candidate's actual points. Highlight the strongest matches, the gaps, and the best ways to strengthen the resume. Use plain, natural language and avoid AI-style wording."}

QUESTION:
${question || 'How strong is this fit?'}

Answer in under 300 words. Be concrete — cite specific parts of the JD and the background, not generic encouragement.`;
}
