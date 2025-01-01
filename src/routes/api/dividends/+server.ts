import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { RequestEvent } from '@sveltejs/kit';
import type { Dividend } from '$lib/types';

const dataPath = path.join(process.cwd(), 'src/lib/data/dividends.json');

async function ensureDirectoryExists() {
    const dir = path.dirname(dataPath);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

export async function GET({ url }: RequestEvent) {
    try {
        const userId = url.searchParams.get('userId');
        const data = await fs.readFile(dataPath, 'utf-8');
        const allDividends: Dividend[] = JSON.parse(data);
        
        if (userId) {
            return json(allDividends.filter(d => d.userId === userId));
        }
        return json([]);
    } catch (error) {
        console.error('Error reading dividends.json:', error);
        return json([]);
    }
}

export async function POST({ request }: RequestEvent) {
    try {
        await ensureDirectoryExists();
        
        // Read existing data
        let existingData: Dividend[] = [];
        try {
            const fileContent = await fs.readFile(dataPath, 'utf-8');
            existingData = JSON.parse(fileContent);
        } catch (error) {
            // If file doesn't exist or is empty, continue with empty array
            existingData = [];
        }

        const newData = await request.json();
        
        // Merge existing and new data, removing duplicates by id
        const mergedData = [...existingData, ...newData].reduce((acc: Dividend[], current: Dividend) => {
            const x = acc.find((item: Dividend) => item.id === current.id);
            if (!x) {
                return [...acc, current];
            } else {
                return acc.map(item => item.id === current.id ? current : item);
            }
        }, [] as Dividend[]);

        await fs.writeFile(dataPath, JSON.stringify(mergedData, null, 2));
        return json({ success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error saving dividends:', errorMessage);
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
} 