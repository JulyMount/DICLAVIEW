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

export const toolGroupId = 'DICLA_TOOL_GROUP';

export function setupTools(renderingEngineId, viewportId) {
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
  
  // Suavização do scroll (sensibilidade ajustada via debounce)
  toolGroup.addTool(StackScrollMouseWheelTool.toolName, {
    debounceTime: 40,
  });

  toolGroup.addTool(LengthTool.toolName);
  toolGroup.addTool(CircleROITool.toolName);
  toolGroup.addTool(PlanarFreehandROITool.toolName);

  toolGroup.addViewport(viewportId, renderingEngineId);

  // Ativar Scroll na Roda do Rato
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  // Botão Esquerdo do Rato Padrão: Janela/Nível
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
  });

  // Botão Direito: Zoom
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
  });

  // Botão do Meio: Pan
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }],
  });

  // Listener para apagar anotação individual com tecla Delete / Backspace
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedUIDs = annotation.selection.getAnnotationsSelected();
      if (selectedUIDs && selectedUIDs.length) {
        selectedUIDs.forEach((uid) => annotation.state.removeAnnotation(uid));
        const renderingEngine = getRenderingEngine(renderingEngineId);
        if (renderingEngine) {
          renderingEngine.renderViewports([viewportId]);
        }
      }
    }
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

  toolsToReset.forEach((t) => {
    toolGroup.setToolPassive(t);
  });

  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
  });
}

export function clearAllAnnotations(renderingEngineId, viewportId) {
  annotation.state.removeAllAnnotations();
  const renderingEngine = getRenderingEngine(renderingEngineId);
  if (renderingEngine) {
    renderingEngine.renderViewports([viewportId]);
  }
}