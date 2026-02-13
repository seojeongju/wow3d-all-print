'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
// @ts-ignore
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { useMakerStore } from '@/store/useMakerStore';

export function Exporter() {
    const { scene } = useThree();
    const { exportTrigger } = useMakerStore();

    useEffect(() => {
        if (exportTrigger === 0) return;

        // Find the group containing our models
        // We named it 'export-target' in Preview3D
        const targetGroup = scene.getObjectByName('export-target');

        if (!targetGroup) {
            console.warn('Nothing to export');
            return;
        }

        try {
            const exporter = new STLExporter();
            // Parse the group to STL binary
            const result = exporter.parse(targetGroup, { binary: true });

            // Create download link
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `wow3d-model-${Date.now()}.stl`;
            link.click();

            // Cleanup
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error('Export failed', e);
            alert('STL Export failed. See console for details.');
        }

    }, [exportTrigger, scene]);

    return null;
}
