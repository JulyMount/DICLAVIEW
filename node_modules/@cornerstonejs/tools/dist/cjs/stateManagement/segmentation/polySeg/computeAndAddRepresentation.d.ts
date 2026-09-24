import { SegmentationRepresentations } from '../../../enums';
declare function computeAndAddRepresentation<T>(segmentationId: string, representationType: SegmentationRepresentations, computeFunction: () => Promise<T>, updateFunction?: () => void): Promise<T>;
export { computeAndAddRepresentation };
