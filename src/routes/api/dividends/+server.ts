import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { connectDB } from '$lib/db/mongo';
import DividendModel from '$lib/models/Dividend';

export async function GET({ url }: RequestEvent) {
    try {
        await connectDB();
        const userId = url.searchParams.get('userId');
        
        if (userId) {
            const dividends = await DividendModel.find({ userId });
            return json(dividends);
        }
        return json([]);
    } catch (error) {
        console.error('Error reading dividends:', error);
        return json({ error: 'Failed to fetch dividends' }, { status: 500 });
    }
}

export async function POST({ request }: RequestEvent) {
    try {
        await connectDB();
        const newData = await request.json();

        if (Array.isArray(newData)) {
            // Handle bulk upsert
            const operations = newData.map(dividend => ({
                updateOne: {
                    filter: { id: dividend.id },
                    update: { $set: dividend },
                    upsert: true
                }
            }));

            await DividendModel.bulkWrite(operations);
        }

        return json({ success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error saving dividends:', errorMessage);
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
} 