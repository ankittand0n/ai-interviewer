import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
const openai = new OpenAI();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

@Injectable()
export class JobService {

async extractTags(jobTitle: string ,jobDescription: string ) {
        const prompt = `
                   Extract ATS tags from the following job description and return them as JSON only in the following format:

                    {
                      "skills": [
                        {
                          "name": "Skill Name",
                          "priority": 1
                        }
                      ],
                      "attributes": [
                        {
                          "name": "Attribute Name",
                          "priority": 1
                        }
                      ]
                    }
                    

                    Ensure that:
                    1. The \`skills\` and \`attributes\` arrays contain objects with \`name\` (string) and \`priority\` (integer from 1 to 5).
                    2. Assign priorities based on the importance of the skill or attribute inferred from the job description.

                    Job Description: ${jobDescription}
                    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const response = completion.choices[0].message.content;
      let extractedTags;

      if (!response) {
        throw new Error('Response is null');
      } else {
        extractedTags =
          JSON.parse(response.replace(/```json|```/g, '').trim()) ?? '{}';
        if (!extractedTags) {
          throw new Error('JSON portion not found in response');
        }
      }

      console.log('Extracted tags:', extractedTags.skills);

      const savedResponse = await prisma.jobTags.create({
        data: {
          jobTitle,
          jobDescription,
          extractedTags,
        },
      });

      return { success: true, data: savedResponse };
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Failed to extract ATS tags' };
    }
  }

  async syncTags() {
    const atsTagsList = await prisma.jobTags.findMany();

    for (const atsTag of atsTagsList) {
      const { skills } = atsTag.extractedTags;

      if (skills && Array.isArray(skills)) {
        for (const skill of skills) {
          const skillName = skill.name;

          // Check if the tag already exists
          const existingTag = await prisma.tag.findUnique({
            where: { name: skillName },
          });

          if (!existingTag) {
            // Save the tag if it doesn't exist
            await prisma.tag.create({
              data: {
                name: skillName
              },
            });
          }
        }
      }
    }
    return { message: 'Tags processed and saved successfully' };
  }

async getAllTags() {
    return await prisma.jobTags.findMany();
} 

async updateTagPriority(
    atsTagId: number,
    skillName: string,
    newPriority: number) {


    const atsTag = await prisma.jobTags.findUnique({
      where: { id: atsTagId },
    });

    if (!atsTag) {
      throw new Error(`atsTag with ID ${atsTagId} not found`);
    }

    const extractedTags = atsTag.extractedTags;

    // Find the skill and update its priority
  const skill = extractedTags.skills.find((s: any) => s.name === skillName);
  if (!skill) {
    throw new Error(`Skill '${skillName}' not found in extractedTags.`);
  }

  skill.priority = newPriority;
    
   // Push the updated JSON back to the database
  await prisma.jobTags.update({
    where: { id: atsTagId },
    data: {
      extractedTags: extractedTags, // Re-stringify the JSON
    },
  });

    return { message: 'Priorities updated successfully' };
  }
}