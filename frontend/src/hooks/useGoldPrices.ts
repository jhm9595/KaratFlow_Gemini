import { useState, useEffect, useCallback } from 'react';
import { getRecentMetalPrices } from '../api/metalPrices';

export interface GoldPriceItem {
    priceDate?: string;
    date: string;
    pricePerGram: number;
    pricePer375g?: number;
    price24k: number;
    price18k: number;
    price14k: number;
    volume?: number;
    value?: number;
}

export function useGoldPrices() {
    const [goldPriceData, setGoldPriceData] = useState<GoldPriceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoldPrices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentMetalPrices();
            if (Array.isArray(data)) {
                setGoldPriceData(data);
            }
        } catch (err: any) {
            console.error('Failed to fetch gold prices:', err);
            setError(err.message || '금 시세 정보를 가져오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGoldPrices();
    }, [fetchGoldPrices]);

    const todayGold = goldPriceData.length > 0 ? goldPriceData[goldPriceData.length - 1] : null;
    const yesterdayGold = goldPriceData.length > 1 ? goldPriceData[goldPriceData.length - 2] : todayGold;

    const delta24k = todayGold && yesterdayGold ? (todayGold.price24k || 0) - (yesterdayGold.price24k || 0) : 0;
    const delta18k = todayGold && yesterdayGold ? (todayGold.price18k || 0) - (yesterdayGold.price18k || 0) : 0;
    const delta14k = todayGold && yesterdayGold ? (todayGold.price14k || 0) - (yesterdayGold.price14k || 0) : 0;

    return {
        goldPriceData,
        loading,
        error,
        refreshGoldPrices: fetchGoldPrices,
        todayGold,
        yesterdayGold,
        delta24k,
        delta18k,
        delta14k
    };
}
