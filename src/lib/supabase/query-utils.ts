/**
 * Supabase Query Utilities
 * Optimized patterns for batching and parallel query execution
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Maximum items per IN clause to avoid PostgreSQL limits
 */
const MAX_IN_CLAUSE_SIZE = 100;

/**
 * Execute multiple independent queries in parallel with error handling.
 * Returns results in the same order as input queries.
 * 
 * @example
 * const [users, posts, comments] = await parallelQueries([
 *   supabase.from('users').select('*').eq('id', userId),
 *   supabase.from('posts').select('*').eq('user_id', userId),
 *   supabase.from('comments').select('*').eq('user_id', userId),
 * ]);
 */
export async function parallelQueries<T extends readonly unknown[]>(
    queries: { [K in keyof T]: Promise<{ data: T[K] | null; error: any }> }
): Promise<{ [K in keyof T]: T[K] | null }> {
    const results = await Promise.all(queries);
    return results.map(r => r.data) as { [K in keyof T]: T[K] | null };
}

/**
 * Execute a query with IN clause, automatically chunking if needed.
 * Prevents hitting PostgreSQL's limit on IN clause items.
 * 
 * @example
 * const users = await chunkedIn(
 *   supabase,
 *   'users',
 *   'id',
 *   largeArrayOfIds,
 *   '*'
 * );
 */
export async function chunkedIn<T>(
    supabase: SupabaseClient,
    table: string,
    column: string,
    values: string[],
    select: string = '*'
): Promise<T[]> {
    if (values.length === 0) {
        return [];
    }

    if (values.length <= MAX_IN_CLAUSE_SIZE) {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .in(column, values);

        if (error) {
            console.error(`chunkedIn error on ${table}:`, error);
            return [];
        }
        return (data || []) as T[];
    }

    // Chunk the values and execute in parallel
    const chunks: string[][] = [];
    for (let i = 0; i < values.length; i += MAX_IN_CLAUSE_SIZE) {
        chunks.push(values.slice(i, i + MAX_IN_CLAUSE_SIZE));
    }

    const results = await Promise.all(
        chunks.map(chunk =>
            supabase
                .from(table)
                .select(select)
                .in(column, chunk)
        )
    );

    const allData: T[] = [];
    for (const result of results) {
        if (result.error) {
            console.error(`chunkedIn chunk error on ${table}:`, result.error);
            continue;
        }
        allData.push(...((result.data || []) as T[]));
    }

    return allData;
}

/**
 * Batch update multiple rows in a single operation.
 * Uses upsert with onConflict to update existing rows.
 * 
 * @example
 * await batchUpdate(supabase, 'daily_quests', 'id', [
 *   { id: 'quest1', current_progress: 5, is_completed: true },
 *   { id: 'quest2', current_progress: 3, is_completed: false },
 * ]);
 */
export async function batchUpdate<T extends Record<string, unknown>>(
    supabase: SupabaseClient,
    table: string,
    conflictColumn: string,
    rows: T[]
): Promise<{ success: boolean; error?: string }> {
    if (rows.length === 0) {
        return { success: true };
    }

    const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: conflictColumn });

    if (error) {
        console.error(`batchUpdate error on ${table}:`, error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Batch insert multiple rows in a single operation.
 * 
 * @example
 * await batchInsert(supabase, 'player_inventory', [
 *   { player_id: 'addr1', cosmetic_id: 'item1', source: 'prestige' },
 *   { player_id: 'addr1', cosmetic_id: 'item2', source: 'prestige' },
 * ]);
 */
export async function batchInsert<T extends Record<string, unknown>>(
    supabase: SupabaseClient,
    table: string,
    rows: T[]
): Promise<{ success: boolean; error?: string }> {
    if (rows.length === 0) {
        return { success: true };
    }

    const { error } = await supabase.from(table).insert(rows);

    if (error) {
        console.error(`batchInsert error on ${table}:`, error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Fetch a single record with fallback to null instead of throwing.
 * Useful for optional record lookups.
 */
export async function fetchSingle<T>(
    query: Promise<{ data: T | null; error: any }>
): Promise<T | null> {
    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') {
        // PGRST116 = "no rows returned" which is fine for optional lookups
        console.error('fetchSingle error:', error);
    }
    return data;
}
