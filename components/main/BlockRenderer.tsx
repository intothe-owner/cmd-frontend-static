"use client";

import React from "react";
import { motion } from "framer-motion";

// --- 기존 인터페이스 타입들 ---
interface ElementNode {
  id: string;
  type: string;
  content: string;
  styles?: any;
  buttonStyles?: any;
  tableData?: any; // 👈 테이블 데이터를 위한 속성
  cardData?: any;
}

interface ColumnNode {
  id: string;
  width: string;
  elements: ElementNode[];
}

interface AnimationConfig {
  type: "none" | "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "zoomIn";
  duration: number;
  delay: number;
}

interface ContainerNode {
  id: string;
  columns: ColumnNode[];
  animation?: AnimationConfig;
}

// 💡 Framer Motion을 활용한 래퍼 컴포넌트
const AnimatedContainer = ({ container, children }: { container: ContainerNode, children: React.ReactNode }) => {
  const { animation } = container;

  if (!animation || animation.type === "none") {
    return <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-wrap">{children}</div>;
  }

  let initialStyle: any = { opacity: 0 };
  let whileInViewStyle: any = { opacity: 1 };

  switch (animation.type) {
    case "slideUp":
      initialStyle.y = 50;
      whileInViewStyle.y = 0;
      break;
    case "slideDown":
      initialStyle.y = -50;
      whileInViewStyle.y = 0;
      break;
    case "slideLeft":
      initialStyle.x = 50;
      whileInViewStyle.x = 0;
      break;
    case "slideRight":
      initialStyle.x = -50;
      whileInViewStyle.x = 0;
      break;
    case "zoomIn":
      initialStyle.scale = 0.8;
      whileInViewStyle.scale = 1;
      break;
    case "fadeIn":
    default:
      break;
  }

  return (
    <motion.div
      initial={initialStyle}
      whileInView={whileInViewStyle}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: animation.duration,
        delay: animation.delay,
        ease: "easeOut",
      }}
      className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-wrap"
    >
      {children}
    </motion.div>
  );
};


export default function BlockRenderer({ blocks }: { blocks: ContainerNode[] }) {
  const getWidthClass = (width: string) => {
    switch (width) {
      case "1/1": return "w-full md:w-full";
      case "1/2": return "w-full md:w-1/2";
      case "1/3": return "w-full md:w-1/3";
      case "2/3": return "w-full md:w-2/3";
      case "1/4": return "w-full md:w-1/4";
      case "3/4": return "w-full md:w-3/4";
      default: return "w-full";
    }
  };

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {blocks.map((container) => (
        <AnimatedContainer key={container.id} container={container}>
          {container.columns.map((column) => (
            <div key={column.id} className={`${getWidthClass(column.width)} px-4 md:px-8 flex flex-col gap-6`}>
              {column.elements.map((el) => (
                <div key={el.id} className="w-full flex" style={{ justifyContent: el.styles?.layerAlign || "flex-start" }}>

                  {/* 1. 텍스트 엘리먼트 */}
                  {el.type === "TEXT" && (
                    <div
                      style={{
                        fontSize: `${el.styles?.fontSize || 16}px`,
                        color: el.styles?.color || "#000",
                        textAlign: el.styles?.textAlign || "left",
                        fontFamily: el.styles?.fontFamily !== "default" ? el.styles?.fontFamily : "inherit",
                        width: el.styles?.width === "auto" ? "100%" : `${el.styles?.width}px`,
                        height: el.styles?.height === "auto" ? "auto" : `${el.styles?.height}px`,
                        fontWeight: el.styles?.fontWeight || "normal",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textDecoration: el.styles?.textDecoration || "none",
                      }}
                      dangerouslySetInnerHTML={{ __html: el.content }}
                      className="whitespace-pre-wrap break-words"
                    />
                  )}

                  {/* 2. 이미지 엘리먼트 */}
                  {el.type === "IMAGE" && el.content && (
                    <img src={el.content} alt="Block Image" className="max-w-full h-auto object-cover rounded-lg shadow-sm" />
                  )}

                  {/* 3. 비디오 엘리먼트 */}
                  {el.type === "VIDEO" && el.content && (
                    <video src={el.content} controls className="max-w-full h-auto rounded-lg shadow-sm" />
                  )}

                  {/* 4. 오디오 엘리먼트 */}
                  {el.type === "AUDIO" && el.content && (
                    <audio src={el.content} controls className="w-full" />
                  )}

                  {/* 5. 버튼 엘리먼트 */}
                  {el.type === "BUTTON" && el.buttonStyles && (
                    <button
                      style={{
                        backgroundColor: el.buttonStyles.backgroundColor,
                        color: el.buttonStyles.color,
                        fontSize: `${el.buttonStyles.fontSize}px`,
                        width: `${el.buttonStyles.width}px`,
                        borderRadius: `${el.buttonStyles.borderRadius}px`,
                      }}
                      className="px-6 py-3 font-bold transition hover:opacity-90 shadow-sm"
                    >
                      {el.buttonStyles.text}
                    </button>
                  )}

                  {/* 6. 구분선 엘리먼트 */}
                  {el.type === "SEPARATOR" && (
                    <div className="w-full h-4 border-b-2 border-dashed border-slate-300"></div>
                  )}

                  {/* 💡 7. 추가된 테이블 엘리먼트 */}
                  {el.type === "TABLE" && el.tableData && (
                    <div className="w-full overflow-x-auto my-2">
                      <table className="w-full border-collapse bg-white">
                        <tbody>
                          {Array.from({ length: el.tableData.rows }).map((_, r) => (
                            <tr key={r}>
                              {Array.from({ length: el.tableData.cols }).map((_, c) => {
                                const cellKey = `${r}-${c}`;
                                const cell = el.tableData.cells[cellKey];

                                // 숨겨진 셀(병합된 셀의 나머지 부분)은 렌더링하지 않음
                                if (!cell || !cell.isVisible) return null;

                                return (
                                  <td
                                    key={cellKey}
                                    rowSpan={cell.rowSpan}
                                    colSpan={cell.colSpan}
                                    className="p-3 break-words"
                                    style={{
                                      textAlign: cell.textAlign,
                                      borderWidth: `${cell.borderWidth ?? 1}px`,
                                      borderColor: cell.borderColor ?? '#cbd5e1',
                                      borderStyle: 'solid'
                                    }}
                                  >
                                    <div dangerouslySetInnerHTML={{ __html: cell.content }} className="w-full min-h-[20px]" />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* 8. 아이콘 */}
                  {el.type === "CARD" && el.cardData && (
                    <motion.div
                      initial={el.cardData.animation !== 'none' ? { opacity: 0, y: el.cardData.animation === 'slideUp' ? 30 : 0, scale: el.cardData.animation === 'zoomIn' ? 0.9 : 1 } : false}
                      whileInView={el.cardData.animation !== 'none' ? { opacity: 1, y: 0, scale: 1 } : undefined}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        borderStyle: 'solid',
                        borderWidth: `${el.cardData.borderWidth}px`,
                        borderColor: el.cardData.borderColor,
                        backgroundColor: el.cardData.backgroundColor,
                        borderRadius: `${el.cardData.borderRadius}px`,
                        padding: `${el.cardData.padding}px`,
                        // 💡 아이콘 정렬 동적 적용 (위아래 모드일 땐 좌중우, 좌우 모드일 땐 상중하)
                        alignItems: el.cardData.layout === 'col'
                          ? (el.styles?.textAlign === 'center' ? 'center' : el.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start')
                          : (el.cardData.verticalAlign || 'center')
                      }}
                      // 💡 그림자 클래스 명시적 할당 적용
                      className={`w-full transition-all flex gap-4 ${el.cardData.layout === 'col' ? 'flex-col' : 'flex-row'} ${
                        el.cardData.shadow === 'sm' ? 'shadow-sm' : 
                        el.cardData.shadow === 'md' ? 'shadow-md' : 
                        el.cardData.shadow === 'lg' ? 'shadow-lg' : 
                        el.cardData.shadow === 'xl' ? 'shadow-xl' : 'shadow-none'
                      }`}
                    >
                      {/* 💡 1. 아이콘 렌더링: el.cardData.iconUrl 사용 */}
                      {el.cardData.iconUrl && (
                        <div className="flex-shrink-0">
                          <img src={el.cardData.iconUrl} style={{ width: el.cardData.iconSize, height: el.cardData.iconSize }} className="object-contain" alt="card-icon" />
                        </div>
                      )}

                      {/* 💡 2. 텍스트 렌더링: 관리자가 설정한 글자 크기, 색상, 정렬 스타일 적용 */}
                      <div 
                        className="flex-grow w-full break-words" 
                        style={{
                            fontSize: el.styles?.fontSize ? `${el.styles.fontSize}px` : '16px',
                            color: el.styles?.color || '#000000',
                            textAlign: el.styles?.textAlign || 'left',
                            fontFamily: el.styles?.fontFamily && el.styles.fontFamily !== 'default' ? el.styles.fontFamily : 'inherit',
                            fontWeight: el.styles?.fontWeight || 'normal',
                            fontStyle: el.styles?.fontStyle || 'normal',
                            textDecoration: el.styles?.textDecoration || 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: el.content }} 
                      />
                    </motion.div>
                  )}

                </div>
              ))}
            </div>
          ))}
        </AnimatedContainer>
      ))}
    </div>
  );
}