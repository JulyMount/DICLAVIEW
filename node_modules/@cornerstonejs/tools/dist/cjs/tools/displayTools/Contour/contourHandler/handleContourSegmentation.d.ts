import { Types, StackViewport } from '@cornerstonejs/core';
import { SegmentationRepresentationConfig, ToolGroupSpecificContourRepresentation } from '../../../../types';
declare function handleContourSegmentation(viewport: StackViewport | Types.IVolumeViewport, geometryIds: string[], annotationUIDsMap: Map<number, Set<string>>, contourRepresentation: ToolGroupSpecificContourRepresentation, contourRepresentationConfig: SegmentationRepresentationConfig): void;
declare function updateContourSets(viewport: Types.IVolumeViewport | StackViewport, geometryIds: string[], contourRepresentation: ToolGroupSpecificContourRepresentation, contourRepresentationConfig: SegmentationRepresentationConfig): void;
declare function addContourSetsToElement(viewport: StackViewport | Types.IVolumeViewport, geometryIds: string[], contourRepresentation: ToolGroupSpecificContourRepresentation, contourRepresentationConfig: SegmentationRepresentationConfig): void;
export { handleContourSegmentation, updateContourSets, addContourSetsToElement, };
