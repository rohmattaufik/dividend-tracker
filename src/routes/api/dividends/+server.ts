import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db, initializeDatabase } from '$lib/db/knex';

export async function GET({ url }: RequestEvent) {
    try {
        await initializeDatabase();
        const userId = url.searchParams.get('userId');
        
        if (userId) {
            const dividends = await db('dividends')
                .where({ userId })
                .orderBy('date', 'desc')
                .select('*');
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
        await initializeDatabase();
        const newData = await request.json();

        if (Array.isArray(newData)) {
            // Handle bulk upsert using CockroachDB's ON CONFLICT
            const promises = newData.map(dividend => 
                db('dividends')
                    .insert(dividend)
                    .onConflict('id')
                    .merge()
            );

            await Promise.all(promises);
        }

        return json({ success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error saving dividends:', errorMessage);
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
} 