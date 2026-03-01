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
        const { title, hashtags } = req.body;

        // Perform Hashtag Analysis (Primary Method)
        const tagString = (hashtags || '') + ' ' + (title || '');
        const tagList = tagString.toLowerCase().split(/[#\s,]+/).filter(t => t);

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

        const finalCategory = bestMatch || 'News';
        console.log(`Detected category via Keyword Scanner: ${finalCategory}`);

        res.status(200).json({ category: finalCategory });

    } catch (err) {
        console.error('Category Detection Error:', err);
        res.status(200).json({ category: 'News' });
    }
};
