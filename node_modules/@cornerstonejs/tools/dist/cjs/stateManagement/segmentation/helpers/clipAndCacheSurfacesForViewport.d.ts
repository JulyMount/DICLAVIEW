import { Types } from '@cornerstonejs/core';
export declare type SurfacesInfo = {
    id: string;
    points: number[];
    polys: number[];
    segmentIndex: number;
};
export declare type SurfaceClipResult = {
    points: number[];
    lines: number[];
    numberOfCells: number;
};
export declare type PolyDataClipCacheType = Map<string, Map<string, SurfaceClipResult>>;
export declare function clipAndCacheSurfacesForViewport(surfacesInfo: SurfacesInfo[], viewport: Types.IVolumeViewport, segmentationRepresentationUID: string): Promise<PolyDataClipCacheType>;
export declare function getSurfaceActorUID(segmentationRepresentationUID: string, surfaceId: string): string;
export declare function generateCacheId(viewport: any, viewPlaneNormal: any, sliceIndex: any): string;
export declare function updatePolyDataCache(actorUID: string, cacheId: string, polyDataResult: SurfaceClipResult): void;
