import { writable, derived } from 'svelte/store';
import type { Dividend } from '$lib/types';
import { browser } from '$app/environment';
import { user } from './auth';

async function loadDividends(userId: string) {
    try {
        const response = await fetch(`/.netlify/functions/dividends?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading dividends:', error);
        return [];
    }
}

async function saveDividends(data: Dividend[]) {
    try {
        const response = await fetch(`/.netlify/functions/dividends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error('Failed to save dividends');
        }
    } catch (error) {
        console.error('Error saving dividends:', error);
        throw error;
    }
}

const allDividends = writable<Dividend[]>([]);

export const dividends = derived(
    [allDividends, user],
    ([$allDividends, $user]) => {
        if (!$user) return [];
        return $allDividends.filter(d => d.userId === $user.uid);
    }
);

user.subscribe(($user) => {
    if ($user && browser) {
        loadDividends($user.uid).then(data => {
            allDividends.set(data);
        });
    } else {
        allDividends.set([]);
    }
});

allDividends.subscribe((value) => {
    if (browser) {
        saveDividends(value).catch(console.error);
    }
});

export { allDividends }; 