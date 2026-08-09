# 📸 MECCA Lens

<img width="1920" height="1080" alt="Group 20" src="https://github.com/user-attachments/assets/72ca7f8a-0a78-4ba7-941d-9aa13b82b36a" />

<br><br>

## 프로젝트 소개

<table style="overflow:hidden">
  <tbody  style="overflow:hidden">
      <td align="left">
          
### MECCA Lens

매장에서 카메라 및 바코드로 상품을 인식한 후 재고, 가격, 관련 상품 등을 바로 확인하여 **구매 결정을 돕는 쇼핑 어시스턴트**

### 주요 기능

- **고객 :** 카메라, 바코드, 이미지 업로드의 3가지 방법으로 상품 스캔 가능
- **직원 :** 바코드 스캔 후, 등록되어 있는 상품만 인식용 이미지 등록 가능
       </td>
     
  </tbody>
</table>

<br>

## 시연 영상
https://www.youtube.com/watch?v=EkGzIJKPWSo

<br>

## 팀원 구성

| Frontend | Backend | Designer | Designer |
|:-------:|:-------:|:-------:|:-------:|
| 김세연 | 박다미 | 김진영 | 양지혜 |

<br>

## 개발 환경
**Frontend :** <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=Nextdotjs&logoColor=white"/>
<img src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square"/>
<img src="https://img.shields.io/badge/Tailwind CSS-06B6D4?style=flat-square&logo=TailwindCSS&logoColor=white"/>
<img src="https://img.shields.io/badge/Zustand-69463f?style=flat-square&logo=&logoColor=white"/> <br>
**Backend :** <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=Express&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white"/> <br>
**AI :** <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=Python&logoColor=white"/>
<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=FastAPI&logoColor=white"/>
<img src="https://img.shields.io/badge/CLIP-000000?style=flat-square&logo=&logoColor=white"/>
<img src="https://img.shields.io/badge/pgvector-4169E1?style=flat-square&logo=&logoColor=white"/>

<br>

## 시스템 아키텍처
<p align="center">
  <img src="https://github.com/user-attachments/assets/08a4a8af-6d3f-481b-8ecc-707fdd0b15b2" width="48%" />
  <img src="https://github.com/user-attachments/assets/702dd6aa-16e7-4033-ae26-390cdb1ef20a" width="48%" />
</p>

<br>

## 페이지별 기능

### [ 고객 - 카메라 스캔 인식 ]
- 스캔 영역에 상품을 맞추면 스캐닝 애니메이션과 함께 자동 촬영
- 인식 결과는 연관 상품과 함께 하단 캐러셀로 표시 (상품명, 가격, 재고)
- 상단 히스토리에서 스캔 당시 이미지와 함께 이전 인식 결과를 재확인 가능
- 결과를 스캔 당시 이미지와 함께 공유하여 상대방도 동일한 인식 결과를 볼 수 있음

<p align="center">
  <img src="https://github.com/user-attachments/assets/75defbdf-e476-423e-ba19-c4d646d6e4bd" width="32%" />
  <img src="https://github.com/user-attachments/assets/cfce05c7-231e-404d-a93b-b83e43230470" width="32%" />
  <img src="https://github.com/user-attachments/assets/bc8eb8a1-1b99-402e-b572-837b2943cb28" width="32%" />
</p>
<br>

### [ 고객 - 바코드 스캔 인식 ]
- 바코드를 스캔해 상품명, 가격, 재고를 바로 확인
- 해당 상품의 온라인 상세 페이지로 이동하여 자세한 정보 확인 가능

<p align="start">
  <img src="https://github.com/user-attachments/assets/a39d0759-54bc-4679-a3e7-6ec686ba267a" width="32%" />
  <img src="https://github.com/user-attachments/assets/425aed91-87c0-479c-be4d-cdb4b270ebfd" width="32%" />
</p>
<br>

### [ 고객 - 이미지 업로드 인식 ]
- 갤러리에서 이미지를 선택해 상품 인식
- 해당 결과와 매장의 실물 상품 매칭을 통해 같은 상품인지 확인 가능

<p align="center">
  <img src="https://github.com/user-attachments/assets/68cc5268-97fe-4f2b-80f4-187ea86aa520" width="32%" />
  <img src="https://github.com/user-attachments/assets/9b3370a4-d21b-4c26-afb0-128cfafa4eb7" width="32%" />
  <img src="https://github.com/user-attachments/assets/8306ebd0-3aa2-40a4-9db0-72a7370c5b64" width="32%" />
</p>
<br>

### [ 직원 - 상품 등록하기 ]
- 바코드 스캔으로 등록된 상품인지 확인 후, 정면 - 양측면 - 윗면을 촬영해 인식용 이미지를 등록

<p align="center">
  <img src="https://github.com/user-attachments/assets/ed7d2b40-0f2a-4111-b006-a14549b5dc24" width="32%"  />
  <img src="https://github.com/user-attachments/assets/b207823b-11b6-4fb0-b573-e5228185503e" width="32%"  />
  <img src="https://github.com/user-attachments/assets/f71dc0d3-ba88-4b97-8e4a-c2ea381b4bab" width="32%"  />
</p>
