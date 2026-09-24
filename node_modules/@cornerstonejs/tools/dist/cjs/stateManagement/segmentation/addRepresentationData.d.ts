import { LabelmapSegmentationData } from '../../types/LabelmapTypes';
import { ContourSegmentationData } from '../../types/ContourTypes';
import { SurfaceSegmentationData } from '../../types/SurfaceTypes';
import SegmentationRepresentations from '../../enums/SegmentationRepresentations';
declare type SegmentationData = LabelmapSegmentationData | ContourSegmentationData | SurfaceSegmentationData;
declare type AddRepresentationData = {
    segmentationId: string;
    type: SegmentationRepresentations;
    data: SegmentationData;
};
declare function addRepresentationData({ segmentationId, type, data, }: AddRepresentationData): void;
export default addRepresentationData;
