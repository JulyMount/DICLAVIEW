import type { Types } from '@cornerstonejs/core';
import { ISculptToolShape } from '../../types/ISculptToolShape';
import { SculptData } from '../SculptorTool';
import { SVGDrawingHelper, EventTypes, ContourAnnotationData } from '../../types';
export declare type PushedHandles = {
    first?: number;
    last?: number;
};
declare class CircleSculptCursor implements ISculptToolShape {
    static shapeName: string;
    private toolInfo;
    renderShape(svgDrawingHelper: SVGDrawingHelper, canvasLocation: Types.Point2, options: any): void;
    pushHandles(viewport: Types.IViewport, sculptData: SculptData): PushedHandles;
    configureToolSize(evt: EventTypes.InteractionEventType): void;
    updateToolSize(canvasCoords: Types.Point2, viewport: Types.IViewport, activeAnnotation: ContourAnnotationData): void;
    getMaxSpacing(minSpacing: number): number;
    getInsertPosition(previousIndex: number, nextIndex: number, sculptData: SculptData): Types.Point3;
    private pushOneHandle;
}
export default CircleSculptCursor;
