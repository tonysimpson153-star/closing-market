# Android 앱 아이콘 사전 점검

- 확인 기준: iOS 최신 기준 Android 빌드 사본 `/home/ubuntu/closing-market-ios6-android-build/closing-market`
- 기본 런처 아이콘 `assets/images/icon.png`: 512×512 PNG 정사각형. 중앙에 카트·사업장 심볼이 배치되어 있고, 글자형 로고가 아니므로 작은 런처 크기에서도 판독성이 유지됩니다.
- Android 적응형 전경 아이콘 `assets/images/android-icon-foreground.png`: 512×512 PNG 정사각형이며 기본 아이콘과 동일한 중앙 심볼을 사용합니다.
- `app.config.ts` 설정: Android 적응형 아이콘 전경에 위 파일을 사용하고, 배경색은 흰색(`#ffffff`)입니다. 따라서 Android 런처에서 플랫폼별 원형·스퀘어 마스크가 적용되어도 심볼이 배경 위에 표시됩니다.
- 결론: 현재 아이콘 파일의 가로세로 비율과 설정 경로는 Android 프로덕션 빌드에 적합합니다. 사용자 제공 로고를 새로 교체하라는 요청은 없으므로 기존 아이콘을 유지합니다.
