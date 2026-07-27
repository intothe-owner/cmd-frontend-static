"use client";

import { useState, useEffect, useRef } from "react";
import {
    ElementType,
    CardData,
    TextStyles,
    ButtonStyles,
    TableCell,
    TableData,
    ElementNode,
    ColumnNode,
    AnimationConfig,
    ContainerNode,
    MenuType,
    SlideItem
} from "@/types/types";

// 아이콘 임포트
import { Sparkles } from "lucide-react"; 

// UI 분리 컴포넌트 임포트
import PageSettings from "@/components/admin/PageSettings";
import SlideManager from "@/components/admin/SlideManager";
import ContainerBoard from "@/components/admin/ContainerBoard";
import BuilderModals from "@/components/admin/BuilderModals";
import { apiUrl } from "@/lib/api";

export default function VisualPageBuilder() {
    // ==========================================
    // 1. 상태 (State) 관리
    // ==========================================
    const [title, setTitle] = useState("");
    const [selectedMenuId, setSelectedMenuId] = useState<string>("");
    const [menus, setMenus] = useState<MenuType[]>([]);
    const [containers, setContainers] = useState<ContainerNode[]>([]);

    const [sliderType, setSliderType] = useState<"none" | "image" | "video">("none");
    const [pageId, setPageId] = useState<number | null>(null);

    const [pageMeta, setPageMeta] = useState({ bgImage: '', bgTitle: '' });
    const [metaBgFile, setMetaBgFile] = useState<File | null>(null);

    const defaultSlide: SlideItem = {
        type: "image",
        mediaUrl: "",
        titleHtml: "",
        descHtml: "",
        titleStyle: { fontSize: 24, color: "#1e293b", fontFamily: "default", textAlign: "left" },
        descStyle: { fontSize: 16, color: "#64748b", fontFamily: "default", textAlign: "left" }
    };
    const [slides, setSlides] = useState<SlideItem[]>([]);

    const [activeSlideFocus, setActiveSlideFocus] = useState<{ index: number; field: 'title' | 'desc' } | null>(null);
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
    const savedRangeRef = useRef<Range | null>(null);

    // 모달 및 UI 상태
    const [layoutModalOpen, setLayoutModalOpen] = useState(false);
    const [elementModalOpen, setElementModalOpen] = useState<{ containerId: string; columnId: string } | null>(null);
    const [tableConfigModalOpen, setTableConfigModalOpen] = useState<{ containerId: string; columnId: string } | null>(null);
    const [tableInputs, setTableInputs] = useState({ rows: 3, cols: 3 });
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDraggingCell, setIsDraggingCell] = useState(false);

    const [animModalOpen, setAnimModalOpen] = useState<string | null>(null);
    const [tempAnim, setTempAnim] = useState<AnimationConfig>({ type: "none", duration: 0.5, delay: 0 });
    const [textBlockFontSize,setTextBlockFontSize] = useState(32); 

    // ==========================================
    // [AI 기능] 상태 추가
    // ==========================================
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);


    // ==========================================
    // 2. 부수 효과 (Effects)
    // ==========================================

    // 문서 선택 영역 추적
    useEffect(() => {
        const handleDocumentSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                if (activeElementId) {
                    const editableDiv = document.getElementById(`editable-${activeElementId}`);
                    if (editableDiv && editableDiv.contains(range.commonAncestorContainer)) {
                        savedRangeRef.current = range.cloneRange();
                    }
                }
            }
        };

        document.addEventListener("selectionchange", handleDocumentSelectionChange);
        return () => {
            document.removeEventListener("selectionchange", handleDocumentSelectionChange);
        };
    }, [activeElementId]);

    // 메뉴 로딩
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch(apiUrl("/api/menus"));
                const json = await res.json();
                if (json.success) {
                    const flatMenus = json.data;
                    const map: Record<number, any> = {};
                    const roots: any[] = [];

                    flatMenus.forEach((m: any) => { map[m.id] = { ...m, children: [] }; });
                    flatMenus.forEach((m: any) => {
                        if (m.parentId && map[m.parentId]) {
                            map[m.parentId].children.push(map[m.id]);
                        } else {
                            roots.push(map[m.id]);
                        }
                    });

                    const sortTree = (nodes: any[]) => {
                        nodes.sort((a, b) => a.order - b.order);
                        nodes.forEach((node) => {
                            if (node.children && node.children.length > 0) sortTree(node.children);
                        });
                    };
                    sortTree(roots);

                    const flattened: any[] = [];
                    const flatten = (nodes: any[]) => {
                        nodes.forEach(node => {
                            flattened.push(node);
                            if (node.children && node.children.length > 0) {
                                flatten(node.children);
                            }
                        });
                    };
                    flatten(roots);

                    setMenus(flattened);
                }
            } catch (error) {
                console.error("메뉴 로딩 실패", error);
            }
        };
        fetchMenus();
    }, []);

    // 선택된 메뉴 ID에 따른 데이터 불러오기
    useEffect(() => {
        loadPageData(selectedMenuId);
    }, [selectedMenuId]);


    // ==========================================
    // 3. API 및 데이터 관리 함수
    // ==========================================
    const loadPageData = async (menuId: string) => {
        if (menuId === "") {
            setPageId(null);
            setTitle("");
            setContainers([]);
            setSlides([]);
            setSliderType("none");
            return;
        }

        try {
            const res = await fetch(apiUrl(`/api/pages/`));
            const json = await res.json();

            if (json.success) {
                const targetMenuId = menuId === "0" ? null : Number(menuId);
                const targetMenu = menus.find(m => m.id === targetMenuId);
                let page = undefined;

                if (targetMenu && targetMenu.url) {
                    const sharedMenuIds = menus.filter(m => m.url === targetMenu.url).map(m => m.id);
                    page = json.data.find((p: any) => p.menuId !== null && sharedMenuIds.includes(p.menuId));
                } else {
                    page = json.data.find((p: any) => p.menuId === targetMenuId);
                }

                if (page) {
                    setPageId(page.id);
                    setTitle(page.title);
                    setContainers(page.contentBlocks || []);
                    if (page.sliderData && page.sliderData.length > 0) {
                        setSlides(page.sliderData);
                        setSliderType(page.sliderData[0].type || "image");
                    } else {
                        setSlides([]);
                        setSliderType("none");
                    }
                } else {
                    setPageId(null);
                    setTitle("");
                    setContainers([]);
                    setSlides([]);
                    setSliderType("none");
                }
            }
        } catch (error) {
            console.error("페이지 데이터 불러오기 실패:", error);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("페이지 제목을 입력해주세요.");
            return;
        }

        const formData = new FormData();
        formData.append("menuId", selectedMenuId === "0" ? "" : selectedMenuId);
        formData.append("title", title);

        const cleanSlides = slides.map(s => {
            const { file, ...rest } = s;
            return rest;
        });

        const cleanContainers = containers.map(c => ({
            ...c,
            columns: c.columns.map(col => ({
                ...col,
                elements: col.elements.map(el => {
                    const { file, ...restEl } = el;

                    const editableDiv = document.getElementById(`editable-${el.id}`);
                    if (editableDiv) {
                        restEl.content = editableDiv.innerHTML;
                    }

                    if (restEl.type === 'TABLE' && restEl.tableData) {
                        const cleanCells: Record<string, any> = {};
                        Object.keys(restEl.tableData.cells).forEach(k => {
                            const { file: cellFile, ...restCell } = restEl.tableData!.cells[k];
                            cleanCells[k] = restCell;
                        });
                        restEl.tableData = { ...restEl.tableData, cells: cleanCells as any };
                    }
                    return restEl;
                })
            }))
        }));

        formData.append("sliderData", JSON.stringify(cleanSlides));
        formData.append("contentBlocks", JSON.stringify(cleanContainers));
        formData.append("pageMeta", JSON.stringify(pageMeta));
        if (metaBgFile) formData.append("meta_bg_file", metaBgFile);

        slides.forEach((slide, idx) => {
            if (slide.file) formData.append(`slide_file_${idx}`, slide.file);
        });

        containers.forEach(container => {
            container.columns.forEach(col => {
                col.elements.forEach(el => {
                    if (el.file) formData.append(`element_file_${el.id}`, el.file);
                    if (el.type === 'TABLE' && el.tableData) {
                        Object.keys(el.tableData.cells).forEach(cellKey => {
                            const cell = el.tableData!.cells[cellKey];
                            if (cell.file) {
                                formData.append(`table_file_${el.id}_${cellKey}`, cell.file);
                            }
                        });
                    }
                });
            });
        });

        try {
            const url = pageId
                ? apiUrl(`/api/pages/${pageId}`)
                : apiUrl("/api/pages");
            const method = pageId ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                body: formData,
            });

            const json = await res.json();

            if (json.success) {
                alert(pageId ? "페이지가 수정되었습니다." : "새 페이지가 생성되었습니다.");
                await loadPageData(selectedMenuId);
            } else {
                alert("저장 실패: " + json.message);
            }
        } catch (error) {
            console.error("페이지 저장 중 오류 발생:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };


    // ==========================================
    // [AI 기능] 생성 핸들러 추가
    // ==========================================
    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) {
            alert("원하시는 형태를 프롬프트로 입력해주세요.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch(apiUrl("/api/ai/generate-page"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt }),
            });

            const json = await res.json();

            if (json.success && Array.isArray(json.elements)) {
                
                // 1. AI가 넘겨준 JSON 배열을 실제 엘리먼트 노드 배열로 변환
                const newElements: ElementNode[] = json.elements.map((el: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    type: el.type, // TEXT, IMAGE, VIDEO 중 하나가 들어옴
                    content: el.content || "",
                    styles: el.type === "TEXT" ? {
                        fontFamily: "default",
                        fontSize: 16,
                        color: "#000000",
                        textAlign: "left",
                        layerAlign: "flex-start",
                        linkUrl: "",
                        width: "auto",
                        height: "auto",
                        fontWeight: "normal",
                        fontStyle: "normal"
                    } : undefined
                }));

                // 2. 가로 전체(1/1) 사이즈의 새 컨테이너에 엘리먼트들을 묶어서 생성
                const newContainer: ContainerNode = {
                    id: Math.random().toString(36).substr(2, 9),
                    columns: [{
                        id: Math.random().toString(36).substr(2, 9),
                        width: "1/1",
                        elements: newElements,
                    }]
                };

                // 3. 현재 컨테이너 목록 끝에 추가
                setContainers([...containers, newContainer]);
                
                // 4. 모달 초기화
                setAiPrompt("");
                setAiModalOpen(false);
            } else {
                alert("AI 생성 실패: " + json.message);
            }
        } catch (error) {
            console.error("AI 생성 중 오류 발생:", error);
            alert("AI 서버와 통신 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };


    // ==========================================
    // 4. 에디터 이벤트 및 조작 핸들러
    // ==========================================
    const handleBoardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.element-box') || (e.target as HTMLElement).closest('.slide-box')) return;
        setActiveElementId(null);
        setActiveSlideFocus(null);
        setSelectedCells(new Set());
    };

    const openAnimModal = (container: ContainerNode) => {
        setTempAnim(container.animation || { type: "none", duration: 0.5, delay: 0 });
        setAnimModalOpen(container.id);
    };

    const saveAnimConfig = () => {
        if (animModalOpen) {
            setContainers(containers.map(c =>
                c.id === animModalOpen ? { ...c, animation: tempAnim } : c
            ));
            setAnimModalOpen(null);
        }
    };

    const addContainer = (layoutStr: string) => {
        const widths = layoutStr.split("+");
        const newColumns: ColumnNode[] = widths.map((w) => ({
            id: Math.random().toString(36).substr(2, 9), width: w, elements: [],
        }));
        setContainers([...containers, { id: Math.random().toString(36).substr(2, 9), columns: newColumns }]);
        setLayoutModalOpen(false);
    };

    const addElement = (type: ElementType) => {
        if (!elementModalOpen) return;
        const { containerId, columnId } = elementModalOpen;

        const newElement: ElementNode = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === "TEXT" ? "제목을 입력해주세요." : "",
            styles: type === "TEXT" ? {
                fontFamily: "default",
                fontSize: 32,
                color: "#000000",
                textAlign: "left",
                layerAlign: "flex-start",
                linkUrl: "",
                width: "auto",
                height: "auto",
                fontWeight: "normal",
                fontStyle: "normal"
            } : undefined
        };

        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col
                )
            } : container
        ));
        setElementModalOpen(null);
    };

    const updateElementProps = (containerId: string, columnId: string, elementId: string, propCategory: 'styles' | 'buttonStyles' | 'tableData' | 'cardData', key: string, value: any) => {

        const editableDiv = document.getElementById(`editable-${elementId}`);
        const currentHtml = editableDiv ? editableDiv.innerHTML : undefined;

        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col => col.id === columnId ? {
                    ...col,
                    elements: col.elements.map(el => {
                        if (el.id === elementId) {
                            return {
                                ...el,
                                content: currentHtml !== undefined ? currentHtml : el.content,
                                [propCategory]: { ...(el[propCategory] as any), [key]: value }
                            };
                        }
                        return el;
                    })
                } : col)
            } : container
        ));
    };

    const updateElementStyle = (containerId: string, columnId: string, elementId: string, key: keyof TextStyles, value: any) => {
        updateElementProps(containerId, columnId, elementId, 'styles', key, value);
    };

    const applyStyleToSelection = (styleType: 'fontSize' | 'color' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'textDecoration' | 'link', value: any) => {
        const range = savedRangeRef.current;
        if (!range || !activeElementId) return false;
        if (range.collapsed) return false;

        try {
            const editableDiv = document.getElementById(`editable-${activeElementId}`);
            if (!editableDiv) return false;

            editableDiv.focus();
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            if (styleType === 'fontSize') {
                document.execCommand('styleWithCSS', false, 'false');
                document.execCommand('fontSize', false, '7');

                const fonts = editableDiv.querySelectorAll('font[size="7"]');
                fonts.forEach(font => {
                    font.removeAttribute('size');
                    (font as HTMLElement).style.fontSize = `${value}px`;
                });

                const spans = editableDiv.querySelectorAll('span');
                spans.forEach(span => {
                    const size = span.style.fontSize;
                    if (size === '48px' || size === 'xxx-large' || size.includes('large') || size === '300%') {
                        span.style.fontSize = `${value}px`;
                    }
                });

                if (selection && selection.rangeCount > 0) {
                    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
                }
                return true;
                
            } else {
                try { (document as any).execCommand("styleWithCSS", false, true); } catch (e) { }

                if (styleType === 'fontWeight') document.execCommand('bold', false, undefined);
                else if (styleType === 'fontStyle') document.execCommand('italic', false, undefined);
                else if (styleType === 'textDecoration') document.execCommand('underline', false, undefined);
                else if (styleType === 'color') document.execCommand('foreColor', false, value);
                else if (styleType === 'fontFamily') document.execCommand('fontName', false, value);
                else if (styleType === 'link') {
                    document.execCommand('createLink', false, value);
                    const links = editableDiv.querySelectorAll(`a[href="${value}"]`);
                    links.forEach(a => {
                        (a as HTMLAnchorElement).target = "_blank";
                        (a as HTMLElement).style.textDecoration = "underline";
                        (a as HTMLElement).style.color = "#1e88e5";
                    });
                }

                if (selection && selection.rangeCount > 0) {
                    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
                }
                return true;
            }
        } catch (e) {
            console.error("스타일 적용 오류:", e);
            return false;
        }
    };

    const updateElementHtmlContent = (elementId: string, htmlContent: string) => {
        setContainers(containers.map(container => ({
            ...container,
            columns: container.columns.map(col => ({
                ...col,
                elements: col.elements.map(el => el.id === elementId ? { ...el, content: htmlContent } : el)
            }))
        })));
    };

    const handleFileUpload = (containerId: string, columnId: string, elementId: string, file: File) => {
        const fileUrl = URL.createObjectURL(file);
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? {
                        ...col,
                        elements: col.elements.map(el =>
                            el.id === elementId ? { ...el, content: fileUrl, file: file } : el
                        )
                    } : col
                )
            } : container
        ));
    };

    const deleteElement = (containerId: string, columnId: string, elementId: string) => {
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: col.elements.filter(el => el.id !== elementId) } : col
                )
            } : container
        ));
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        } else {
            savedRangeRef.current = null;
        }
    };

    const handleResizeStart = (e: React.MouseEvent, containerId: string, columnId: string, el: ElementNode, direction: string) => {
        e.stopPropagation();
        e.preventDefault();

        const elementNode = document.getElementById(`element-${el.id}`);
        if (!elementNode) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = elementNode.offsetWidth;
        const startHeight = elementNode.offsetHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (direction.includes("e")) newWidth = startWidth + deltaX;
            if (direction.includes("w")) newWidth = startWidth - deltaX;
            if (direction.includes("s")) newHeight = startHeight + deltaY;
            if (direction.includes("n")) newHeight = startHeight - deltaY;

            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(30, newHeight);

            setContainers((prev) =>
                prev.map((container) =>
                    container.id === containerId ? {
                        ...container,
                        columns: container.columns.map((col) =>
                            col.id === columnId ? {
                                ...col,
                                elements: col.elements.map((element) =>
                                    element.id === el.id && element.styles
                                        ? { ...element, styles: { ...element.styles, width: newWidth, height: newHeight } }
                                        : element
                                ),
                            } : col
                        ),
                    } : container
                )
            );
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // 테이블 관련 
    const openTableConfig = () => {
        if (!elementModalOpen) return;
        setTableConfigModalOpen({ containerId: elementModalOpen.containerId, columnId: elementModalOpen.columnId });
        setElementModalOpen(null);
        setTableInputs({ rows: 3, cols: 3 });
    };

    const confirmTableConfig = () => {
        if (!tableConfigModalOpen) return;
        const { containerId, columnId } = tableConfigModalOpen;
        const { rows, cols } = tableInputs;

        const initialCells: Record<string, TableCell> = {};
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                initialCells[`${r}-${c}`] = {
                    row: r, col: c, content: "",
                    rowSpan: 1, colSpan: 1, isVisible: true, textAlign: "center",
                    borderWidth: 1, borderColor: "#cbd5e1"
                };
            }
        }

        const newElement: ElementNode = {
            id: Math.random().toString(36).substr(2, 9),
            type: "TABLE",
            content: "",
            tableData: { rows, cols, cells: initialCells }
        };

        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col)
            } : container
        ));
        setTableConfigModalOpen(null);
    };

    const applyToTableCells = (containerId: string, columnId: string, elementId: string, tableData: TableData, key: keyof TableCell, value: any) => {
        const newCells = { ...tableData.cells };
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(newCells);
        targetKeys.forEach(k => {
            if (newCells[k]) {
                newCells[k] = { ...newCells[k], [key]: value };
            }
        });
        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
    };

    const getCommonBorderWidth = (tableData: TableData) => {
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells);
        if (targetKeys.length === 0) return 1;
        return tableData.cells[targetKeys[0]]?.borderWidth ?? 1;
    };

    const getCommonBorderColor = (tableData: TableData) => {
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells);
        if (targetKeys.length === 0) return '#cbd5e1';
        return tableData.cells[targetKeys[0]]?.borderColor ?? '#cbd5e1';
    };

    const mergeCells = (containerId: string, columnId: string, elementId: string, tableData: TableData) => {
        if (selectedCells.size < 2) return alert("병합할 셀을 2개 이상 선택하세요.");

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        Array.from(selectedCells).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (c < minC) minC = c; if (c > maxC) maxC = c;
        });

        const newCells = { ...tableData.cells };
        const topLeftKey = `${minR}-${minC}`;

        newCells[topLeftKey].rowSpan = maxR - minR + 1;
        newCells[topLeftKey].colSpan = maxC - minC + 1;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (`${r}-${c}` !== topLeftKey) newCells[`${r}-${c}`].isVisible = false;
            }
        }

        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set());
    };

    const unmergeCells = (containerId: string, columnId: string, elementId: string, cellKey: string, tableData: TableData) => {
        const cell = tableData.cells[cellKey];
        if (!cell || (cell.rowSpan === 1 && cell.colSpan === 1)) return;

        const newCells = { ...tableData.cells };

        for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
            for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
                newCells[`${r}-${c}`].isVisible = true;
            }
        }

        newCells[cellKey].rowSpan = 1;
        newCells[cellKey].colSpan = 1;

        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set([cellKey]));
    };


    // ==========================================
    // 5. 렌더링 (View)
    // ==========================================
    return (
        <div className="max-w-6xl mx-auto pb-20 h-screen" onClick={handleBoardClick} onMouseUp={() => setIsDraggingCell(false)}>

            <PageSettings
                selectedMenuId={selectedMenuId}
                setSelectedMenuId={setSelectedMenuId}
                menus={menus}
                title={title}
                setTitle={setTitle}
                handleSave={handleSave}
                pageMeta={pageMeta}
                setPageMeta={setPageMeta}
                setMetaBgFile={setMetaBgFile}
            />

            <SlideManager
                sliderType={sliderType}
                setSliderType={setSliderType}
                slides={slides}
                setSlides={setSlides}
                activeSlideFocus={activeSlideFocus}
                setActiveSlideFocus={setActiveSlideFocus}
                defaultSlide={defaultSlide}
            />

            <ContainerBoard
                containers={containers}
                setContainers={setContainers}
                activeElementId={activeElementId}
                setActiveElementId={setActiveElementId}
                setLayoutModalOpen={setLayoutModalOpen}
                setElementModalOpen={setElementModalOpen}
                openAnimModal={openAnimModal}
                deleteElement={deleteElement}
                handleFileUpload={handleFileUpload}
                updateElementStyle={updateElementStyle}
                updateElementProps={updateElementProps}
                updateElementHtmlContent={updateElementHtmlContent}
                applyStyleToSelection={applyStyleToSelection}
                handleSelection={handleSelection}
                handleResizeStart={handleResizeStart}
                selectedCells={selectedCells}
                setSelectedCells={setSelectedCells}
                isDraggingCell={isDraggingCell}
                setIsDraggingCell={setIsDraggingCell}
                mergeCells={mergeCells}
                unmergeCells={unmergeCells}
                getCommonBorderWidth={getCommonBorderWidth}
                getCommonBorderColor={getCommonBorderColor}
                applyToTableCells={applyToTableCells}
                savedRangeRef={savedRangeRef}
                // [AI 추가] ContainerBoard 내부로 상태 제어 넘김
                setAiModalOpen={setAiModalOpen}
            />

            <BuilderModals
                layoutModalOpen={layoutModalOpen}
                setLayoutModalOpen={setLayoutModalOpen}
                addContainer={addContainer}
                elementModalOpen={elementModalOpen}
                setElementModalOpen={setElementModalOpen}
                addElement={addElement}
                tableConfigModalOpen={tableConfigModalOpen}
                setTableConfigModalOpen={setTableConfigModalOpen}
                tableInputs={tableInputs}
                setTableInputs={setTableInputs}
                openTableConfig={openTableConfig}
                confirmTableConfig={confirmTableConfig}
                animModalOpen={animModalOpen}
                setAnimModalOpen={setAnimModalOpen}
                tempAnim={tempAnim}
                setTempAnim={setTempAnim}
                saveAnimConfig={saveAnimConfig}
                containers={containers}
                setContainers={setContainers}
            />

            {/* ========================================== */}
            {/* [추가] AI 프롬프트 입력 모달창 */}
            {/* ========================================== */}
            {aiModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px] max-w-full m-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-purple-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">제미나이 AI 페이지 생성기</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">
                            생성하고 싶은 UI 레이아웃, 텍스트 내용 등을 상세히 적어주시면 AI가 HTML 코드를 짜서 새 블록으로 추가합니다.
                        </p>
                        
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="예: '회사 연혁을 보여주는 타임라인 UI를 만들어줘. 각 연도별로 텍스트가 들어가고 배경은 연한 파란색으로 해줘'"
                            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => { setAiModalOpen(false); setAiPrompt(""); }}
                                className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-semibold text-sm"
                                disabled={isGenerating}
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleGenerateAI}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold text-sm disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        생성 중...
                                    </>
                                ) : (
                                    "생성하기"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
