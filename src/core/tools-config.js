import {
  addTool,
  ToolGroupManager,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollMouseWheelTool,
  LengthTool,
  CircleROITool,
  PlanarFreehandROITool,
  annotation,
  Enums as ToolsEnums,
} from '@cornerstonejs/tools';
import { getRenderingEngine } from '@cornerstonejs/core';

export const toolGroupId = 'DICLA_MPR_TOOL_GROUP';

export function setupTools(renderingEngineId, viewportIds) {
  addTool(WindowLevelTool);
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(StackScrollMouseWheelTool);
  addTool(LengthTool);
  addTool(CircleROITool);
  addTool(PlanarFreehandROITool);

  let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
  if (!toolGroup) {
    toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  }

  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName, { debounceTime: 40 });
  toolGroup.addTool(LengthTool.toolName);
  toolGroup.addTool(CircleROITool.toolName);
  toolGroup.addTool(PlanarFreehandROITool.toolName);

  // Associa os 3 viewports MPR ao mesmo grupo de ferramentas
  viewportIds.forEach((vId) => {
    toolGroup.addViewport(vId, renderingEngineId);
  });

  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }],
  });
}

export function setActiveTool(toolName) {
  const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
  if (!toolGroup) return;

  const toolsToReset = [
    WindowLevelTool.toolName,
    PanTool.toolName,
    ZoomTool.toolName,
    LengthTool.toolName,
    CircleROITool.toolName,
    PlanarFreehandROITool.toolName,
  ];

  toolsToReset.forEach((t) => toolGroup.setToolPassive(t));

  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
  });
}

export function clearAllAnnotations(renderingEngineId, viewportIds) {
  annotation.state.removeAllAnnotations();
  const renderingEngine = getRenderingEngine(renderingEngineId);
  if (renderingEngine) {
    renderingEngine.renderViewports(viewportIds);
  }
}