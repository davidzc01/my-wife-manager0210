import React, { useState, useEffect } from 'react';
import { saveImages, loadData } from '../services/storage';
import Layout from './Layout';

interface Image {
  id: string;
  url: string;
  type: 'SFW' | 'NSFW';
  uploadedAt: string;
  description?: string;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'SFW' | 'NSFW' | 'ALL'>('SFW');
  const [error] = useState('');
  const [success, setSuccess] = useState('');

  // 加载图片数据
  useEffect(() => {
    const data = loadData();
    if (data && data.images) {
      setImages(data.images);
    }
  }, []);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: Image[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const image: Image = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url: event.target.result as string,
            type: 'SFW', // 默认上传为SFW
            uploadedAt: new Date().toISOString(),
          };
          newImages.push(image);

          // 当所有图片都处理完成后保存
          if (newImages.length === files.length) {
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            saveImages(updatedImages);
            setSuccess(`成功上传 ${newImages.length} 张图片！`);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理图片类型切换
  const toggleImageType = (id: string) => {
    const updatedImages = images.map((image) => {
      if (image.id === id) {
        return {
          ...image,
          type: image.type === 'SFW' ? 'NSFW' : 'SFW' as 'SFW' | 'NSFW',
        };
      }
      return image;
    });
    setImages(updatedImages);
    saveImages(updatedImages);
    setSuccess('图片类型已更新！');
  };

  // 处理图片删除
  const deleteImage = (id: string) => {
    const updatedImages = images.filter((image) => image.id !== id);
    setImages(updatedImages);
    saveImages(updatedImages);
    setSuccess('图片已删除！');
  };

  // 打开图片查看器
  const openImageViewer = (image: Image, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  // 关闭图片查看器
  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  // 切换到下一张图片
  const nextImage = () => {
    const filteredImages = images.filter((img) => filter === 'ALL' || img.type === filter);
    if (filteredImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
      setSelectedImage(filteredImages[(currentIndex + 1) % filteredImages.length]);
    }
  };

  // 切换到上一张图片
  const prevImage = () => {
    const filteredImages = images.filter((img) => filter === 'ALL' || img.type === filter);
    if (filteredImages.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
      setSelectedImage(filteredImages[(currentIndex - 1 + filteredImages.length) % filteredImages.length]);
    }
  };

  // 过滤图片
  const filteredImages = images.filter((img) => filter === 'ALL' || img.type === filter);

  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-purple-800 p-8">
        <h2 className="text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">图片画廊</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6 shadow-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-600 text-green-400 px-4 py-3 rounded-lg mb-6 shadow-lg">
            {success}
          </div>
        )}

        {/* 图片上传区域 */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">上传图片</h3>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-10 text-center shadow-lg border border-purple-700/50">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-pink-500/50 rounded-xl cursor-pointer bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <div className="flex flex-col items-center justify-center pt-8 pb-10">
                <svg className="w-20 h-20 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-pink-300 mt-4 text-lg">点击或拖拽图片到此处上传</p>
                <p className="text-pink-200/70 mt-2 text-sm">支持批量上传，默认上传为SFW内容</p>
              </div>
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* 图片过滤和统计 */}
        <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-3">图片管理</h3>
            <p className="text-gray-300 text-lg">共 {images.length} 张图片 | 显示 {filteredImages.length} 张</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('SFW')}
              className={`px-5 py-3 rounded-lg transition-all duration-300 ease-in-out ${filter === 'SFW' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              SFW
            </button>
            <button
              onClick={() => setFilter('NSFW')}
              className={`px-5 py-3 rounded-lg transition-all duration-300 ease-in-out ${filter === 'NSFW' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              NSFW
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-5 py-3 rounded-lg transition-all duration-300 ease-in-out ${filter === 'ALL' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              全部
            </button>
          </div>
        </div>

        {/* 图片瀑布流 */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8">
          {filteredImages.length === 0 ? (
            <div className="text-center py-20 break-inside-avoid">
              <p className="text-gray-400 text-2xl">暂无图片</p>
              <p className="text-gray-500 mt-3">请上传图片到画廊</p>
            </div>
          ) : (
            filteredImages.map((image, index) => (
              <div key={image.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg group relative hover:shadow-[0_0_25px_rgba(236,72,153,0.3)] transition-all duration-500 border border-purple-700/30 mb-8 break-inside-avoid">
                <div className="cursor-pointer overflow-hidden flex items-center justify-center" onClick={() => openImageViewer(image, index)}>
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="max-w-full max-h-80 object-contain transition-all duration-500 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full">
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${image.type === 'SFW' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {image.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${image.type === 'SFW' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {image.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => toggleImageType(image.id)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs py-2 px-3 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                    >
                      切换类型
                    </button>
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs py-2 px-3 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 图片查看器 */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-6xl max-h-[90vh] w-full">
              <button
                onClick={closeImageViewer}
                className="absolute top-6 right-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] transform hover:scale-110"
              >
                ×
              </button>
              <div className="flex items-center justify-center">
                <button
                  onClick={prevImage}
                  className="absolute left-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                >
                  ←
                </button>
                <img
                  src={selectedImage.url}
                  alt="Selected image"
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
                <button
                  onClick={nextImage}
                  className="absolute right-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                >
                  →
                </button>
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className={`inline-block text-sm font-bold px-4 py-2 rounded-full ${selectedImage.type === 'SFW' ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}>
                  {selectedImage.type}
                </span>
                <p className="text-gray-300 text-lg mt-3">
                  {currentIndex + 1} / {filteredImages.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;