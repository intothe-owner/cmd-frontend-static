# 제로브이 프론트엔드 정적 내보내기 및 호스팅어 배포

## 1. 구조

이 프론트엔드는 `output: "export"` 방식으로 정적 HTML/CSS/JS를 생성합니다.
Node.js 백엔드는 별도 주소에서 실행해야 합니다.

- 프론트엔드 예시: `https://www.zerov.co.kr`
- Node.js API 예시: `https://api.zerov.co.kr`

정적 프론트엔드에서는 서버 컴포넌트가 API를 호출하지 않습니다. 모든 API 요청은 브라우저에서 Node.js 백엔드로 전송됩니다.

## 2. 설치

```bash
npm install
```

원본 프로젝트에서 사용 중이지만 누락되어 있던 `lucide-react`를 `package.json`에 추가했습니다. 기존 `package-lock.json`을 사용하는 환경에서 잠금파일 오류가 발생하면 다음 명령으로 잠금파일을 갱신하세요.

```bash
npm install --package-lock-only
npm install
```

## 3. API 주소 설정

### 개발 중

`public/runtime-config.js`:

```js
window.__ZEROV_CONFIG__ = {
  API_URL: "http://localhost:4000"
};
```

### 실제 배포

Node.js 백엔드 주소로 변경합니다.

```js
window.__ZEROV_CONFIG__ = {
  API_URL: "https://api.zerov.co.kr"
};
```

`runtime-config.js`는 빌드 후 `out/runtime-config.js`에도 복사됩니다. 따라서 빌드가 끝난 뒤 해당 파일만 수정해도 API 주소를 변경할 수 있습니다.

## 4. 정적 빌드

```bash
npm run build:static
```

성공하면 프로젝트 루트에 `out` 폴더가 생성됩니다.

```text
out/
├── index.html
├── runtime-config.js
├── page/
├── boards/
├── login/
├── register/
├── admin/
└── _next/
```

## 5. 호스팅어 업로드

1. 호스팅어 hPanel에서 프론트엔드 도메인의 파일 관리자를 엽니다.
2. `public_html` 안의 기본 파일을 백업하거나 제거합니다.
3. `out` 폴더 자체가 아니라 **out 폴더 안의 모든 파일과 폴더**를 `public_html`에 업로드합니다.
4. `public_html/runtime-config.js`의 `API_URL`을 실제 Node.js 백엔드 주소로 확인합니다.
5. 브라우저에서 프론트엔드 도메인을 엽니다.

## 6. 정적 배포용 주소 변경

빌드 시점에 알 수 없는 DB 페이지·게시판 번호를 지원하기 위해 동적 경로를 쿼리 주소로 변경했습니다.

| 기존 주소 | 정적 배포 주소 |
|---|---|
| `/회사소개` | `/page/?id=회사소개` |
| `/boards/3` | `/boards/?boardId=3` |
| `/boards/3/write` | `/boards/write/?boardId=3` |
| `/boards/3/25` | `/boards/post/?boardId=3&postId=25` |
| `/boards/3/25/edit` | `/boards/edit/?boardId=3&postId=25` |
| `/popup-view/2` | `/popup-view/?id=2` |

메뉴 DB에 기존 주소가 저장되어 있어도 `Header.tsx`의 `toStaticHref()`가 자동 변환합니다.

## 7. Node.js 백엔드 필수 설정

프론트엔드와 API 도메인이 다르므로 Node.js 서버에서 CORS를 허용해야 합니다.

```js
app.use(cors({
  origin: [
    "https://zerov.co.kr",
    "https://www.zerov.co.kr"
  ],
  credentials: true
}));
```

백엔드가 HTTPS라면 프론트엔드도 HTTPS로 접속해야 합니다. HTTPS 프론트엔드에서 HTTP API를 호출하면 브라우저가 혼합 콘텐츠로 차단합니다.

## 8. 수정한 핵심 내용

- `next.config.ts`: `output: "export"`, `trailingSlash`, 이미지 최적화 비활성화
- 서버에서 실행되던 API 요청을 클라이언트 요청으로 변경
- 빌드 시 API 서버가 없어도 정적 파일 생성이 가능하도록 변경
- 모든 `localhost:4000` 직접 참조를 공통 `apiUrl()` 함수로 교체
- 런타임 API 설정 파일 추가
- 동적 App Router 폴더 제거 및 정적 쿼리 기반 페이지로 변경
- 게시판 목록·글쓰기·상세·수정·팝업 주소 변환
- CMS 메뉴에 저장된 기존 주소 자동 변환

## 9. 주의사항

- 정적 프론트엔드만 올리면 로그인, 게시판, 관리자 기능은 작동하지 않습니다. Node.js API 서버가 별도로 실행 중이어야 합니다.
- Node.js API에서 업로드 파일 URL을 완전한 HTTPS 주소로 반환하는 것이 안전합니다.
- `/mypage`와 `/admin/member`는 원본 압축파일에 페이지 파일이 없으며, 해당 링크를 사용하려면 별도로 페이지를 구현해야 합니다.
