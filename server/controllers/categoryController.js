const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALLOWED_CATEGORIES = [
    'Technology', 'Lifestyle', 'Health & Fitness', 'Travel', 'Food & Recipes',
    'Education', 'Finance & Business', 'Entertainment & Sports', 'News'
];

const CATEGORY_KEYWORDS = {
    'Technology': ['tech', 'gadget', 'coding', 'ai', 'software', 'hardware', 'web', 'app', 'innovation', 'digital', 'data'],
    'Lifestyle': ['life', 'habit', 'productivity', 'self-care', 'minimalism', 'fashion', 'home', 'wellness', 'daily'],
    'Health & Fitness': ['health', 'fitness', 'workout', 'diet', 'mental', 'gym', 'yoga', 'nutrition', 'medical', 'muscle'],
    'Travel': ['travel', 'trip', 'adventure', 'vacation', 'explore', 'tourism', 'destination', 'wanderlust', 'hotel'],
    'Food & Recipes': ['food', 'recipe', 'cooking', 'chef', 'meal', 'baking', 'restaurant', 'healthy-eating', 'vegan'],
    'Education': ['learn', 'study', 'teaching', 'school', 'university', 'skill', 'course', 'knowledge', 'student'],
    'Finance & Business': ['business', 'finance', 'money', 'startup', 'market', 'investing', 'economy', 'wealth', 'corporate'],
    'Entertainment & Sports': ['movie', 'music', 'gaming', 'celebrity', 'sports', 'football', 'cricket', 'game', 'show', 'art']
};

exports.detectCategory = async (req, res) => {
    try {
        const { title, content, hashtags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        console.log('Detecting category. API Key present:', !!process.env.GEMINI_API_KEY);

        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        let detected = null;

        if (process.env.GEMINI_API_KEY) {
            // We'll try v1 first as it's often more stable for 404 issues
            const apiVersions = ['v1', 'v1beta'];

            for (const apiVersion of apiVersions) {
                if (detected) break;

                for (const modelName of modelsToTry) {
                    try {
                        console.log(`Trying Gemini [${apiVersion}] model: ${modelName}`);
                        // Specify the version in the request options
                        const model = genAI.getGenerativeModel(
                            { model: modelName },
                            { apiVersion }
                        );

                        const sampleContent = content.substring(0, 2000);
                        const prompt = `Classify this blog into ONE category: ${ALLOWED_CATEGORIES.join(', ')}. 
                        Title: ${title}. Content: ${sampleContent}. Hashtags: ${hashtags || 'None'}. 
                        Return ONLY the category name.`;

                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        const text = response.text().trim();

                        detected = ALLOWED_CATEGORIES.find(cat => cat.toLowerCase() === text.toLowerCase());
                        if (detected) {
                            console.log(`Model ${modelName} [${apiVersion}] successfully detected: ${detected}`);
                            break;
                        }
                    } catch (aiErr) {
                        console.warn(`Gemini model ${modelName} [${apiVersion}] failed:`, aiErr.message);
                    }
                }
            }
        }

        if (detected) {
            return res.status(200).json({ category: detected });
        }

        // 2. Fallback: Robust Hashtag Analysis
        const tagList = (hashtags || '').toLowerCase().split(/[#\s,]+/).filter(t => t);

        let bestMatch = null;
        let maxHits = 0;

        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            let hits = 0;
            tagList.forEach(tag => {
                if (keywords.some(k => tag.includes(k) || k.includes(tag)) || cat.toLowerCase().includes(tag)) {
                    hits++;
                }
            });
            if (hits > maxHits) {
                maxHits = hits;
                bestMatch = cat;
            }
        }

        if (bestMatch) {
            console.log('Hashtag-based classification:', bestMatch);
            return res.status(200).json({ category: bestMatch });
        }

        // 3. Final Resort
        res.status(200).json({ category: 'News' });

    } catch (err) {
        console.error('DetectCategory Error:', err);
        res.status(200).json({ category: 'News' });
    }
};
