const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALLOWED_CATEGORIES = [
    'Technology', 'Lifestyle', 'Health & Fitness', 'Travel', 'Food & Recipes',
    'Education', 'Finance & Business', 'Entertainment & Sports'
];

exports.detectCategory = async (req, res) => {
    try {
        const { title, content, hashtags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Limiting content to ~2000 characters as requested
        const sampleContent = content.substring(0, 2000);

        const prompt = `
You are a content classification system.

Classify the following blog article into ONE of these categories only:

Technology
Lifestyle
Health & Fitness
Travel
Food & Recipes
Education
Finance & Business
Entertainment & Sports

Rules:
- Return ONLY the category name.
- Do not explain.
- Do not add extra text.
- If unsure, return the closest matching category.

Article Title:
${title}

Article Content:
${sampleContent}

Hashtags:
${hashtags || 'None'}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Validate Gemini's response
        const detectedCategory = ALLOWED_CATEGORIES.find(
            cat => cat.toLowerCase() === text.toLowerCase()
        );

        if (detectedCategory) {
            res.status(200).json({ category: detectedCategory });
        } else {
            console.warn('Gemini returned an invalid category:', text);
            res.status(200).json({ category: null });
        }

    } catch (err) {
        console.error('DetectCategory Error:', err);

        // Fallback: try to fetch from hashtags if AI fails
        if (hashtags) {
            const tagList = hashtags.toLowerCase().split(/[#\s,]+/).filter(t => t);
            const match = ALLOWED_CATEGORIES.find(cat =>
                tagList.some(tag => cat.toLowerCase().includes(tag) || tag.includes(cat.toLowerCase().replace('&', '').replace(' ', '')))
            );
            if (match) {
                console.log('Fallback to hashtag match:', match);
                return res.status(200).json({ category: match });
            }
        }

        // Final fallback
        res.status(200).json({ category: 'Lifestyle' });
    }
};
