"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface SlideItem {
  type: "image" | "video";
  mediaUrl: string;
  titleHtml: string;
  descHtml: string;
  titleStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: "left" | "center" | "right";
  };
  descStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: "left" | "center" | "right";
  };
}

interface MainSliderProps {
  slides: SlideItem[];
}

export default function MainSlider({ slides }: MainSliderProps) {
  if (!slides || slides.length === 0) return null;

  // 비디오 슬라이드일 경우 단일 비디오 렌더링
  if (slides[0].type === "video") {
    const videoSlide = slides[0];
    return (
      // 💡 높이를 h-[50vh] 대신 h-screen으로 변경하여 브라우저 전체를 덮도록 수정
      <div className="relative w-full h-screen overflow-hidden">
        <video
          src={videoSlide.mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <SlideContent slide={videoSlide} />
      </div>
    );
  }

  // 이미지 슬라이드일 경우 Swiper 렌더링
  return (
    // 💡 여기도 h-screen으로 변경
    <div className="w-full h-screen  group">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={slides.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        className="w-full h-full relative"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative w-full h-full">
            {slide.mediaUrl ? (
              <img
                src={slide.mediaUrl}
                alt={`Slide ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
            )}
            
            <div className="absolute inset-0" />
            
            <SlideContent slide={slide} />
          </SwiperSlide>
        ))}

        <div className="swiper-button-prev !text-white opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl drop-shadow-md hidden md:flex" />
        <div className="swiper-button-next !text-white opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl drop-shadow-md hidden md:flex" />
      </Swiper>
    </div>
  );
}

function SlideContent({ slide }: { slide: SlideItem }) {
  const getFontFamily = (fontFamily: string) => 
    fontFamily !== "default" ? fontFamily : "inherit";

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center max-w-6xl mx-auto px-6 md:px-12 z-10 pt-16">
      {/* items-center와 text-center를 적용하여 가로/세로 정중앙 정렬 */}
      <div className="w-full flex flex-col items-center text-center gap-4">
        
        {/* 슬라이드 제목 */}
        <div
          style={{
            fontSize: `${slide.titleStyle.fontSize}px`,
            color: slide.titleStyle.color,
            fontFamily: getFontFamily(slide.titleStyle.fontFamily),
          }}
          className="drop-shadow-lg leading-tight w-full"
          dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
        />
        
        {/* 슬라이드 내용 */}
        <div
          style={{
            fontSize: `${slide.descStyle.fontSize}px`,
            color: slide.descStyle.color,
            fontFamily: getFontFamily(slide.descStyle.fontFamily),
          }}
          className="drop-shadow-md max-w-2xl leading-relaxed w-full"
          dangerouslySetInnerHTML={{ __html: slide.descHtml }}
        />
      </div>
    </div>
  );
}