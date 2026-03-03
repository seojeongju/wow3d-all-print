'use client';

import { useFileStore } from '@/store/useFileStore';
import { useEffect } from 'react';

/**
 * 전역적으로 샘플 파일을 로드하는 컴포넌트
 * 파일 스토어가 비어있을 때 public/jet_engine_rotor.stl을 자동으로 로드합니다.
 */
export function SampleFileLoader() {
    const { file, setFile } = useFileStore();

    useEffect(() => {
        // 이미 파일이 있으면 로드하지 않음
        if (file) return;

        const loadSample = async () => {
            try {
                const response = await fetch('/jet_engine_rotor.stl');
                if (!response.ok) throw new Error('Failed to fetch sample STL');

                const blob = await response.blob();
                const sampleFile = new File([blob], 'jet_engine_rotor.stl', { type: 'model/stl' });

                // Zustand 스토어에 파일 설정
                setFile(sampleFile);
                console.log('✅ Sample jet engine model loaded');
            } catch (error) {
                console.error('❌ Failed to load sample file:', error);
            }
        };

        loadSample();
    }, [file, setFile]);

    return null;
}
