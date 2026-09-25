import * as cornerstone from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import dicomImageLoaderModule from '@cornerstonejs/dicom-image-loader';
import { cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';
import dicomParser from 'dicom-parser';

const dicomImageLoader = dicomImageLoaderModule.default || dicomImageLoaderModule;

export async function initCornerstone() {
  await cornerstone.init();
  await initTools();

  dicomImageLoader.external.cornerstone = cornerstone;
  dicomImageLoader.external.dicomParser = dicomParser;

  // CORREÇÃO: Provedor de metadados seguro contra falhas de inicialização
  cornerstone.metaData.addProvider((type, imageId) => {
    if (imageId.startsWith('wadouri:') && dicomImageLoader.wadouri.metaData.get) {
      return dicomImageLoader.wadouri.metaData.get(type, imageId);
    }
    return undefined;
  }, 10000);

  dicomImageLoader.configure({
    useWebWorkers: true, // É recomendado manter os workers ativos
    decodeConfig: { convertFloatPixelDataToInt: false },
  });

  cornerstone.volumeLoader.registerUnknownVolumeLoader(
    cornerstoneStreamingImageVolumeLoader
  );
  cornerstone.volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  console.log('Dicla View Engine MPR: Inicializada com sucesso!');
}