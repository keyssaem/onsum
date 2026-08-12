/**
 * 개발위원 명단 (첨부4).
 * 명단이 바뀌면 이 파일만 수정하면 화면에 바로 반영됩니다.
 */
export const COMMITTEE = [
  {
    group: "감수 및 기획",
    members: [
      { role: "감수 장학사", name: "김인선", affiliation: "청양교육지원청" },
      {
        role: "기획 교사",
        name: "백소라",
        affiliation: "청양교육지원청 Wee센터",
      },
    ],
  },
  {
    group: "집필위원",
    members: [
      { role: "교사", name: "유인선", affiliation: "충남관광보건고등학교" },
      { role: "교사", name: "김우리", affiliation: "모산중학교" },
      { role: "교사", name: "서동우", affiliation: "서산중학교" },
      { role: "교사", name: "어성우", affiliation: "염작초등학교" },
      { role: "교사", name: "이재오", affiliation: "아산초등학교" },
      { role: "교사", name: "이효신", affiliation: "서천초등학교" },
    ],
  },
  {
    group: "검토위원",
    members: [
      { role: "교사", name: "오유미", affiliation: "홍성교육지원청 Wee센터" },
      { role: "교사", name: "장강희", affiliation: "충청남도교육청" },
      { role: "교사", name: "장서현", affiliation: "당진교육지원청 Wee센터" },
    ],
  },
] as const;
