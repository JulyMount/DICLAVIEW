import { setActiveTool, clearAllAnnotations } from '../core/tools-config.js';
import {
  WindowLevelTool,
  PanTool,
  ZoomTool,
  LengthTool,
  CircleROITool,
  PlanarFreehandROITool,
} from '@cornerstonejs/tools';

export function updateActiveButtonUI(activeId) {
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;

  // Remove destaque de todos os botões da barra de ferramentas
  toolbar.querySelectorAll('*').forEach((el) => {
    el.classList.remove('active');
  });

  const activeElement = document.getElementById(activeId);
  if (!activeElement) return;

  // Destaca o botão selecionado
  activeElement.classList.add('active');

  // Se estiver num menu suspenso (dropdown), ativa o botão pai
  const parentDropdown = activeElement.closest('.dropdown');
  if (parentDropdown) {
    parentDropdown.classList.add('active');
  }
}

export function setupToolbarEvents(renderingEngineId, viewportIds) {
  const btnJanela = document.getElementById('btn-janela');
  const btnZoom = document.getElementById('btn-zoom');
  const btnPan = document.getElementById('btn-pan');
  const btnCaneta = document.getElementById('btn-caneta');
  const btnMedirLinha = document.getElementById('btn-medir-linha');
  const btnMedirCirculo = document.getElementById('btn-medir-circulo');

  btnJanela?.addEventListener('click', () => {
    setActiveTool(WindowLevelTool.toolName);
    updateActiveButtonUI('btn-janela');
  });

  btnZoom?.addEventListener('click', () => {
    setActiveTool(ZoomTool.toolName);
    updateActiveButtonUI('btn-zoom');
  });

  btnPan?.addEventListener('click', () => {
    setActiveTool(PanTool.toolName);
    updateActiveButtonUI('btn-pan');
  });

  btnCaneta?.addEventListener('click', () => {
    setActiveTool(PlanarFreehandROITool.toolName);
    updateActiveButtonUI('btn-caneta');
  });

  btnMedirLinha?.addEventListener('click', () => {
    setActiveTool(LengthTool.toolName);
    updateActiveButtonUI('btn-medir-linha');
    const btnMedir = document.getElementById('btn-medir');
    if (btnMedir) btnMedir.innerText = '📏 Linha ▼';
  });

  btnMedirCirculo?.addEventListener('click', () => {
    setActiveTool(CircleROITool.toolName);
    updateActiveButtonUI('btn-medir-circulo');
    const btnMedir = document.getElementById('btn-medir');
    if (btnMedir) btnMedir.innerText = '⭕ Círculo ▼';
  });

  document.getElementById('btn-limpar')?.addEventListener('click', () => {
    clearAllAnnotations(renderingEngineId, viewportIds);
  });

  updateActiveButtonUI('btn-janela');
}