const { supabaseAdmin } = require('./config/supabase');

const initStorage = async () => {
    if (!supabaseAdmin) {
        console.warn('Supabase Service Role Key missing! Automatic storage initialization skipped.');
        return;
    }

    const buckets = ['avatars', 'blog-images'];

    try {
        console.log('Ensuring storage buckets exist...');
        const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();

        if (listError) {
            console.error('Error listing storage buckets:', listError.message || listError);
            console.warn('Buckets might need to be created manually in Supabase Dashboard.');
            return;
        }

        for (const bucketName of buckets) {
            try {
                const bucketExists = existingBuckets && existingBuckets.find(b => b.name === bucketName);

                if (!bucketExists) {
                    console.log(`Creating "${bucketName}" bucket...`);
                    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                        public: true,
                        fileSizeLimit: 5242880, // 5MB
                        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
                    });

                    if (createError) {
                        console.error(`Failed to create bucket "${bucketName}":`, createError.message);
                    } else {
                        console.log(`"${bucketName}" bucket created successfully.`);
                    }
                } else {
                    console.log(`"${bucketName}" bucket already exists.`);
                    // Ensure it is public
                    await supabaseAdmin.storage.updateBucket(bucketName, { public: true }).catch(() => { });
                }
            } catch (innerErr) {
                console.error(`Error processing bucket "${bucketName}":`, innerErr.message);
            }
        }
    } catch (err) {
        console.error('Fatal Storage Initialization Error:', err.message);
        console.warn('The server will continue to run, but uploads might fail until buckets are created.');
    }
};

module.exports = initStorage;
