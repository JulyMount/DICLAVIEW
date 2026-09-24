import * as cornerstone from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import dicomImageLoaderModule from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

const dicomImageLoader = dicomImageLoaderModule.default || dicomImageLoaderModule;

export async function initCornerstone() {
  await cornerstone.init();
  await initTools();

  // Associa o cornerstone e o dicomParser ao carregador
  dicomImageLoader.external.cornerstone = cornerstone;
  dicomImageLoader.external.dicomParser = dicomParser;

  if (typeof dicomImageLoader.init === 'function') {
    dicomImageLoader.init({
      maxWebWorkers: navigator.hardwareConcurrency || 4,
    });
  } else if (typeof dicomImageLoader.configure === 'function') {
    dicomImageLoader.configure({
      useWebWorkers: true,
    });
  }

  console.log('Dicla View Engine: Inicializada com sucesso!');
}