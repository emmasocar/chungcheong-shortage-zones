import { useState, useMemo } from "react";

// gap: 적정대수 - 현재대수 (올림, 목표가동률 40%, 연간CVR)
// fr: 배차 실패율 (2026.02.09~03.08)
const RAW = [
  {r1:"충남",id:12037,name:"아산역 2번출구(KTX환승)",       cur:33,opt:42,gap:9, fr:48.5,att:23840},
  {r1:"충남",id:6566, name:"GS수퍼마켓 천안두정점",         cur:9, opt:13,gap:4, fr:37.1,att:6274},
  {r1:"충북",id:13266,name:"오송K주차장",                   cur:6, opt:10,gap:4, fr:41.8,att:6496},
  {r1:"충북",id:7256, name:"충북혁신도시버스터미널 옆",      cur:7, opt:10,gap:3, fr:29.1,att:4438},
  {r1:"충남",id:5224, name:"용화동 근린공원 옆",             cur:6, opt:9, gap:3, fr:7.5, att:3032},
  {r1:"대전",id:19326,name:"유성자이아파트 옆",              cur:5, opt:8, gap:3, fr:41.1,att:3524},
  {r1:"충북",id:14751,name:"제천중앙시장 옆",               cur:4, opt:7, gap:3, fr:38.6,att:2727},
  {r1:"충남",id:9918, name:"제일카센터 주차장",              cur:3, opt:6, gap:3, fr:41.8,att:2865},
  {r1:"대전",id:10756,name:"봉명동 우산거리",               cur:3, opt:6, gap:3, fr:37.7,att:2263},
  {r1:"대전",id:6056, name:"대전역(KTX) 역전시장 옆",       cur:3, opt:6, gap:3, fr:9.0, att:3185},
  {r1:"대전",id:1178, name:"전민 공영주차장",               cur:2, opt:5, gap:3, fr:48.5,att:2394},
  {r1:"대전",id:19180,name:"정부청사역 4번 출구",            cur:1, opt:4, gap:3, fr:59.5,att:1386},
  {r1:"충북",id:11350,name:"롯데마트 제천점 야외주차장",    cur:1, opt:4, gap:3, fr:45.2,att:1492},
  {r1:"충남",id:20272,name:"내포 골든타워 주차장",           cur:1, opt:4, gap:3, fr:34.6,att:1081},
  {r1:"세종",id:19765,name:"나성동 마크원애비뉴(전기차)",   cur:1, opt:4, gap:3, fr:25.0,att:1571,note:"이용시간 왜곡 의심"},
  {r1:"충북",id:2058, name:"사창사거리",                    cur:13,opt:15,gap:2, fr:34.9,att:8109},
  {r1:"대전",id:16991,name:"대전역(KTX) 정동",              cur:9, opt:11,gap:2, fr:51.9,att:8816},
  {r1:"충남",id:4828, name:"성정동 클럽뉴욕",               cur:9, opt:11,gap:2, fr:51.5,att:5093},
  {r1:"대전",id:15004,name:"큰마을네거리 옆",               cur:6, opt:8, gap:2, fr:45.8,att:5078},
  {r1:"충북",id:11367,name:"제천고속버스터미널 옆",         cur:5, opt:7, gap:2, fr:34.3,att:3576},
  {r1:"충남",id:13722,name:"보령종합터미널 앞",             cur:5, opt:7, gap:2, fr:38.5,att:4818},
  {r1:"충북",id:14360,name:"청주 더케이인하우스",           cur:5, opt:7, gap:2, fr:43.9,att:4097},
  {r1:"충북",id:10517,name:"엔포드호텔",                    cur:4, opt:6, gap:2, fr:37.9,att:2577},
  {r1:"충남",id:9544, name:"신부유료주차장",                cur:4, opt:6, gap:2, fr:8.2, att:2994},
  {r1:"대전",id:1306, name:"한양프라자 주차장",             cur:3, opt:5, gap:2, fr:41.5,att:3382},
  {r1:"충북",id:6418, name:"올리브상가 주차장",             cur:3, opt:5, gap:2, fr:39.0,att:3366},
  {r1:"대전",id:1075, name:"노은역 동편광장 환승주차장",    cur:3, opt:5, gap:2, fr:48.0,att:3635},
  {r1:"충남",id:14284,name:"롯데마트 홍성점",               cur:3, opt:5, gap:2, fr:24.1,att:2303},
  {r1:"충남",id:15544,name:"공주터미널 주차장",             cur:3, opt:5, gap:2, fr:9.4, att:3120},
  {r1:"대전",id:11299,name:"스타벅스 충남대정문점 뒤",      cur:3, opt:5, gap:2, fr:36.9,att:3617},
  {r1:"충남",id:10640,name:"천안갤러리아백화점 앞",         cur:3, opt:5, gap:2, fr:38.3,att:2520},
  {r1:"충북",id:12169,name:"GS더프레시 청주봉명점",        cur:3, opt:5, gap:2, fr:39.1,att:3262},
  {r1:"대전",id:19685,name:"투썸 대전둔산중앙점(전기차)",  cur:2, opt:4, gap:2, fr:56.6,att:2528},
  {r1:"충남",id:9882, name:"대천역 옆 부설주차장",          cur:2, opt:4, gap:2, fr:41.4,att:3305},
  {r1:"대전",id:22356,name:"용문역 7번출구",                cur:1, opt:3, gap:2, fr:14.8,att:864},
  {r1:"세종",id:1564, name:"메가박스 세종점",               cur:1, opt:3, gap:2, fr:38.9,att:1428},
  {r1:"대전",id:14698,name:"리베라아이누리아파트",          cur:1, opt:3, gap:2, fr:45.4,att:1557},
  {r1:"대전",id:13402,name:"관저시외버스정류소 옆",         cur:1, opt:3, gap:2, fr:29.0,att:763},
  {r1:"충남",id:14166,name:"금강빌딩",                      cur:1, opt:3, gap:2, fr:17.6,att:1134},
  {r1:"충남",id:18502,name:"아산시외버스터미널",            cur:1, opt:3, gap:2, fr:25.7,att:1403},
  {r1:"대전",id:9858, name:"대전한일주차장",                cur:1, opt:3, gap:2, fr:46.5,att:1654},
  {r1:"충북",id:16550,name:"롯데 하이마트 율량점",          cur:1, opt:3, gap:2, fr:40.0,att:1692},
  {r1:"대전",id:14104,name:"관평동 디티비안S빌딩 옆",       cur:1, opt:3, gap:2, fr:44.4,att:2076},
  {r1:"충남",id:13721,name:"동문웨딩홀 주차장",             cur:1, opt:3, gap:2, fr:48.5,att:1775},
  {r1:"충남",id:19563,name:"예산 한국유통 주차장",          cur:1, opt:3, gap:2, fr:26.6,att:1024},
  {r1:"충북",id:6749, name:"롯데시네마 청주용암점",         cur:1, opt:3, gap:2, fr:42.7,att:1930},
  {r1:"대전",id:19136,name:"대전 중앙로역 4번출구",         cur:1, opt:3, gap:2, fr:12.2,att:1175},
  {r1:"세종",id:20184,name:"도램마을4단지 뒤(전기차)",      cur:1, opt:3, gap:2, fr:41.8,att:729, note:"이용시간 왜곡 의심"},
  {r1:"충남",id:7912, name:"천안아산역(KTX) 2번출구",       cur:1, opt:3, gap:2, fr:74.9,att:1081},
  {r1:"대전",id:13776,name:"롯데시네마 대전센트럴 뒤",      cur:1, opt:3, gap:2, fr:41.3,att:2529},
  // gap 1은 실패율 40% 이상만 포함
  {r1:"대전",id:14626,name:"대전역(KTX)",                   cur:30,opt:31,gap:1, fr:9.5, att:19488},
  {r1:"충북",id:2058, name:"사창사거리(참고)",              cur:13,opt:15,gap:2, fr:34.9,att:8109},
  {r1:"대전",id:16991,name:"대전역(KTX) 정동",              cur:9, opt:11,gap:2, fr:51.9,att:8816},
  {r1:"대전",id:13460,name:"대전원신흥초등학교 앞",          cur:5, opt:6, gap:1, fr:58.8,att:6082},
  {r1:"충북",id:17024,name:"프라임타워",                    cur:6, opt:7, gap:1, fr:38.2,att:5957},
  {r1:"대전",id:11702,name:"투썸 대전둔산중앙점 앞",        cur:6, opt:7, gap:1, fr:39.2,att:4211},
  {r1:"충남",id:3732, name:"방죽안 오거리",                 cur:6, opt:7, gap:1, fr:5.7, att:3238},
  {r1:"대전",id:2876, name:"큰마을네거리",                  cur:6, opt:7, gap:1, fr:8.0, att:2636},
  {r1:"대전",id:15756,name:"롯데백화점 대전점",             cur:6, opt:7, gap:1, fr:32.3,att:5034},
  {r1:"세종",id:12068,name:"케이티온S타워 주차장",          cur:2, opt:3, gap:1, fr:62.0,att:1508},
  {r1:"대전",id:14508,name:"대전역(KTX) 동광장",            cur:2, opt:3, gap:1, fr:70.1,att:3737},
  {r1:"대전",id:13791,name:"대전도안초등학교 앞",            cur:2, opt:3, gap:1, fr:66.3,att:2307},
  {r1:"세종",id:12066,name:"싱싱장터 도담도담",             cur:2, opt:3, gap:1, fr:58.0,att:1722},
  {r1:"대전",id:1015, name:"서대전역 주차장",               cur:2, opt:3, gap:1, fr:54.6,att:3840},
  {r1:"대전",id:1224, name:"그랑채 주차장",                 cur:2, opt:3, gap:1, fr:47.9,att:2867},
  {r1:"충북",id:13520,name:"청주브릭스타워",                cur:1, opt:2, gap:1, fr:56.1,att:1046},
  {r1:"충남",id:6605, name:"롯데슈퍼천안청당점",            cur:1, opt:2, gap:1, fr:57.6,att:2037},
  {r1:"대전",id:19772,name:"월평노외공영주차장",            cur:1, opt:2, gap:1, fr:60.0,att:1224},
  {r1:"세종",id:9824, name:"새롬고등학교 옆",               cur:1, opt:2, gap:1, fr:52.8,att:1431},
  {r1:"대전",id:9858, name:"대전한일주차장",                cur:1, opt:3, gap:2, fr:46.5,att:1654},
];

// 중복 제거
const SEEN = new Set();
const DATA = RAW.filter(d => { if(SEEN.has(d.id)) return false; SEEN.add(d.id); return true; });

// 우선순위 점수 = gap × 10 + fr × 0.5 (gap 가중치 높게)
const scored = DATA.map(d => ({...d, score: d.gap * 10 + d.fr * 0.5}));

const RC = {"대전":{bg:"#E6F1FB",c:"#185FA5"},"세종":{bg:"#EAF3DE",c:"#3B6D11"},"충남":{bg:"#FAEEDA",c:"#633806"},"충북":{bg:"#EEEDFE",c:"#3C3489"}};
const RCD = {"대전":{bg:"#042C53",c:"#85B7EB"},"세종":{bg:"#173404",c:"#C0DD97"},"충남":{bg:"#412402",c:"#FAC775"},"충북":{bg:"#26215C",c:"#CFCDF5"}};

// 등급 결정 (gap + 실패율 기준)
function grade(d) {
  if (d.gap >= 3 && d.fr >= 40) return {label:"S \u2014 즉시 증차",  bg:"#FCEBEB", c:"#791F1F"};
  if (d.gap >= 2 && d.fr >= 40) return {label:"A \u2014 적극 증차",  bg:"#FAECE7", c:"#993C1D"};
  if (d.gap >= 3 && d.fr >= 20) return {label:"A \u2014 적극 증차",  bg:"#FAECE7", c:"#993C1D"};
  if (d.gap >= 1 && d.fr >= 55) return {label:"A \u2014 적극 증차",  bg:"#FAECE7", c:"#993C1D"};
  if (d.gap >= 2 && d.fr >= 20) return {label:"B \u2014 증차 검토",  bg:"#FAEEDA", c:"#633806"};
  if (d.gap >= 1 && d.fr >= 40) return {label:"B \u2014 증차 검토",  bg:"#FAEEDA", c:"#633806"};
  return                              {label:"C \u2014 모니터링",    bg:"#F1EFE8", c:"#5F5E5A"};
}

const GRADES = ["전체","S \u2014 즉시 증차","A \u2014 적극 증차","B \u2014 증차 검토"];
const REGIONS = ["전체","대전","세종","충남","충북"];

export default function App() {
  const [gFilter, setGFilter] = useState("전체");
  const [rFilter, setRFilter] = useState("전체");
  const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const rc = isDark ? RCD : RC;

  const rows = useMemo(() =>
    scored
      .filter(d => rFilter === "전체" || d.r1 === rFilter)
      .filter(d => {
        if (gFilter === "전체") return grade(d).label !== "C \u2014 모니터링";
        return grade(d).label === gFilter;
      })
      .sort((a,b) => b.score - a.score),
    [gFilter, rFilter]
  );

  const sCount = scored.filter(d=>grade(d).label==="S \u2014 즉시 증차").length;
  const aCount = scored.filter(d=>grade(d).label==="A \u2014 적극 증차").length;
  const bCount = scored.filter(d=>grade(d).label==="B \u2014 증차 검토").length;
  const totalAdd = rows.reduce((s,d)=>s+d.gap,0);

  return (
    <div style={{fontFamily:"var(--font-sans,sans-serif)", padding:"16px 0", color:"var(--color-text-primary)"}}>

      <div style={{marginBottom:14}}>
        <div style={{fontSize:18, fontWeight:500, marginBottom:4}}>충청 증차 1순위 존</div>
        <div style={{fontSize:12, color:"var(--color-text-secondary)"}}>
          배차 실패율(2026.02~03) &times; 적정 Gap(연간 CVR&middot;40%) 교차 분석 &middot; 2026.03.16
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14}}>
        {[
          {label:"S 즉시 증차", val:`${sCount}개`, bg:"#FCEBEB", c:"#791F1F", sub:"Gap 3\u2191 + 실패율 40%\u2191"},
          {label:"A 적극 증차", val:`${aCount}개`, bg:"#FAECE7", c:"#993C1D", sub:"Gap 2\u2191 or 실패율 55%\u2191"},
          {label:"B 증차 검토", val:`${bCount}개`, bg:"#FAEEDA", c:"#633806", sub:"Gap 1\u2191 + 실패율 40%\u2191"},
          {label:"현재 선택 증차", val:`+${totalAdd}대`, bg:"var(--color-background-secondary)", c:"var(--color-text-primary)", sub:`${rows.length}개 존`},
        ].map(m=>(
          <div key={m.label} style={{background:m.bg, borderRadius:8, padding:"10px 14px"}}>
            <div style={{fontSize:11, color:m.c, marginBottom:4, fontWeight:500}}>{m.label}</div>
            <div style={{fontSize:20, fontWeight:600, color:m.c}}>{m.val}</div>
            <div style={{fontSize:11, color:m.c, opacity:0.7, marginTop:2}}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 등급 기준 설명 */}
      <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 16px", marginBottom:14, fontSize:12, lineHeight:1.8}}>
        <strong>등급 기준</strong> &nbsp;
        <span style={{color:"#791F1F", fontWeight:500}}>S</span>: Gap 3\u2191 AND 실패율 40%\u2191 &nbsp;&middot;&nbsp;
        <span style={{color:"#993C1D", fontWeight:500}}>A</span>: Gap 2\u2191 AND 실패율 40%\u2191, OR Gap 3\u2191 AND 실패율 20%\u2191, OR Gap 1\u2191 AND 실패율 55%\u2191 &nbsp;&middot;&nbsp;
        <span style={{color:"#633806", fontWeight:500}}>B</span>: Gap 2\u2191 AND 실패율 20%\u2191, OR Gap 1\u2191 AND 실패율 40%\u2191
      </div>

      {/* 필터 */}
      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
        <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
          {GRADES.map(g=>(
            <button key={g} onClick={()=>setGFilter(g)} style={{
              padding:"5px 14px", borderRadius:20, fontSize:11, cursor:"pointer",
              border: gFilter===g?"none":"0.5px solid var(--color-border-secondary)",
              background: gFilter===g?"var(--color-text-primary)":"transparent",
              color: gFilter===g?"var(--color-background-primary)":"var(--color-text-secondary)",
              fontWeight: gFilter===g?500:400,
            }}>{g}</button>
          ))}
        </div>
        <div style={{display:"flex", gap:4}}>
          {REGIONS.map(r=>(
            <button key={r} onClick={()=>setRFilter(r)} style={{
              padding:"5px 12px", borderRadius:20, fontSize:11, cursor:"pointer",
              border: rFilter===r?"none":"0.5px solid var(--color-border-secondary)",
              background: rFilter===r?"var(--color-text-primary)":"transparent",
              color: rFilter===r?"var(--color-background-primary)":"var(--color-text-secondary)",
              fontWeight: rFilter===r?500:400,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
          <thead>
            <tr style={{background:"var(--color-background-secondary)"}}>
              {["#","존명","지역","현재","적정","Gap","실패율","실패건","등급"].map((h,i)=>(
                <th key={i} style={{
                  padding:"7px 9px", fontSize:11, fontWeight:500,
                  color:"var(--color-text-secondary)", textAlign:i<=2?"left":"right",
                  borderBottom:"1.5px solid var(--color-border-secondary)", whiteSpace:"nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d,i) => {
              const g   = grade(d);
              const rc_ = rc[d.r1] || RC["대전"];
              const rowBg = g.label.startsWith("S")
                ? (isDark?"rgba(226,75,74,0.08)":"rgba(252,235,235,0.5)")
                : g.label.startsWith("A")
                ? (isDark?"rgba(216,90,48,0.06)":"rgba(250,236,231,0.35)")
                : "transparent";
              return (
                <tr key={d.id+"-"+i} style={{background:rowBg}}>
                  <td style={{padding:"6px 9px", color:"var(--color-text-secondary)", fontSize:11, borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{i+1}</td>
                  <td style={{padding:"6px 9px", borderBottom:"0.5px solid var(--color-border-tertiary)", fontWeight:g.label.startsWith("S")?500:400}}>
                    {d.name}
                    {d.note && <span style={{fontSize:10, color:"#EF9F27", marginLeft:4}}>&#9888;</span>}
                  </td>
                  <td style={{padding:"6px 9px", borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                    <span style={{display:"inline-block", fontSize:10, padding:"1px 7px", borderRadius:8, fontWeight:500, background:rc_.bg, color:rc_.c}}>{d.r1}</span>
                  </td>
                  <td style={{padding:"6px 9px", textAlign:"right", borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{d.cur}대</td>
                  <td style={{padding:"6px 9px", textAlign:"right", borderBottom:"0.5px solid var(--color-border-tertiary)", fontWeight:600}}>{d.opt}대</td>
                  <td style={{padding:"6px 9px", textAlign:"right", borderBottom:"0.5px solid var(--color-border-tertiary)", fontWeight:700,
                    color:d.gap>=3?"#A32D2D":d.gap>=2?"#993C1D":"#633806"
                  }}>+{d.gap}</td>
                  <td style={{padding:"6px 9px", textAlign:"right", borderBottom:"0.5px solid var(--color-border-tertiary)", fontWeight:d.fr>=55?600:400,
                    color:d.fr>=60?"#A32D2D":d.fr>=40?"#993C1D":"var(--color-text-primary)"
                  }}>{d.fr}%</td>
                  <td style={{padding:"6px 9px", textAlign:"right", borderBottom:"0.5px solid var(--color-border-tertiary)", color:"var(--color-text-secondary)", fontSize:11}}>{d.att.toLocaleString()}</td>
                  <td style={{padding:"6px 9px", borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                    <span style={{display:"inline-block", fontSize:10, padding:"2px 8px", borderRadius:8, fontWeight:500, background:g.bg, color:g.c}}>{g.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:"var(--color-background-secondary)"}}>
              <td colSpan={5} style={{padding:"8px 9px", fontSize:12, color:"var(--color-text-secondary)", fontWeight:500}}>합계 ({rows.length}개 존)</td>
              <td style={{padding:"8px 9px", textAlign:"right", fontWeight:700, color:"#A32D2D", fontSize:13}}>+{totalAdd}대</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 산출 기준 섹션 */}
      <div style={{marginTop:20, borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:16}}>
        <div style={{fontSize:14, fontWeight:500, marginBottom:12}}>산출 기준 및 방법론</div>

        {/* STEP 1 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
            <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--color-background-secondary)", fontSize:11, fontWeight:600, flexShrink:0}}>1</span>
            적정 대수 산출
          </div>
          <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", fontSize:12, lineHeight:1.9}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:12, background:"var(--color-background-primary)", padding:"8px 12px", borderRadius:6, marginBottom:8, border:"0.5px solid var(--color-border-tertiary)"}}>
              적정 대수 = CEILING( 일평균 존클릭자수 &times; 예약전환율(CVR) &times; 건당 이용시간(h) &divide; (목표 가동률 &times; 24) )
            </div>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:11}}>
              <tbody>
                {[
                  ["일평균 존클릭자수","앱에서 해당 존을 클릭한 일별 순 이용자 수 평균","aggregate_zone_funnel (2025.01~2026.03, 연간 기준)"],
                  ["예약전환율 (CVR)","존 클릭 후 실제 예약으로 이어진 비율","총 완료 예약수 \u00F7 (일평균 클릭자수 \u00D7 집계 일수)"],
                  ["건당 이용시간","1회 예약당 평균 실이용시간 (시간 단위)","reservation_info 완료 예약 기준, 72h 초과 제외"],
                  ["목표 가동률","차량 1대가 하루 중 얼마나 사용되어야 하는가","40% 적용 (충청 지역 현실 기준)"],
                  ["CEILING (올림)","차량은 정수 단위 \u2014 0.1대도 1대가 필요","단순 반올림 시 수요 과소평가 오류 방지"],
                ].map(([k,v,s])=>(
                  <tr key={k}>
                    <td style={{padding:"4px 8px 4px 0", fontWeight:500, color:"var(--color-text-primary)", width:"22%", verticalAlign:"top"}}>{k}</td>
                    <td style={{padding:"4px 8px", color:"var(--color-text-secondary)", width:"40%", verticalAlign:"top"}}>{v}</td>
                    <td style={{padding:"4px 0 4px 8px", color:"var(--color-text-tertiary)", fontSize:10, verticalAlign:"top"}}>{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* STEP 2 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
            <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--color-background-secondary)", fontSize:11, fontWeight:600, flexShrink:0}}>2</span>
            Gap 산출
          </div>
          <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", fontSize:12, lineHeight:1.9}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:12, background:"var(--color-background-primary)", padding:"8px 12px", borderRadius:6, marginBottom:8, border:"0.5px solid var(--color-border-tertiary)"}}>
              Gap = 적정 대수 &minus; 현재 운영 대수 &nbsp;&rarr;&nbsp; Gap &gt; 0 이면 증차 필요
            </div>
            <div style={{fontSize:11, color:"var(--color-text-secondary)"}}>
              현재 운영 대수: car_info (state=5 운영중, imaginary=0 실차량, sharing_type='socar') 기준 실시간 집계
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
            <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--color-background-secondary)", fontSize:11, fontWeight:600, flexShrink:0}}>3</span>
            배차 실패율 산출
          </div>
          <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", fontSize:12, lineHeight:1.9}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize:12, background:"var(--color-background-primary)", padding:"8px 12px", borderRadius:6, marginBottom:8, border:"0.5px solid var(--color-border-tertiary)"}}>
              배차 실패율 = available_car_count = 0 인 조회 수 &divide; 전체 조회 수 &times; 100
            </div>
            <div style={{fontSize:11, color:"var(--color-text-secondary)"}}>
              출처: service_metrics.log_get_car_classes (2026.02.09~03.08, 최근 4주)<br/>
              의미: 이용자가 해당 존을 조회했을 때 실제로 "차 없음"을 경험한 비율 &mdash; 가동률보다 직접적인 수요 미충족 지표
            </div>
          </div>
        </div>

        {/* STEP 4 등급 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
            <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--color-background-secondary)", fontSize:11, fontWeight:600, flexShrink:0}}>4</span>
            우선순위 등급 기준
          </div>
          <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", fontSize:12}}>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:11}}>
              <thead>
                <tr>
                  {["등급","Gap 조건","배차 실패율 조건","의미"].map(h=>(
                    <th key={h} style={{padding:"4px 8px", textAlign:"left", color:"var(--color-text-secondary)", fontWeight:500, borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["S \u2014 즉시 증차","Gap \u2265 3","실패율 \u2265 40%","수요 초과가 크고, 이용자가 실제로 차 없음을 자주 경험"],
                  ["A \u2014 적극 증차","Gap \u2265 2 OR Gap \u2265 3","실패율 \u2265 40% OR \u2265 20% OR (Gap=1, 실패율 \u2265 55%)","명확한 수요 부족 또는 실패율이 매우 높아 즉각 조치 필요"],
                  ["B \u2014 증차 검토","Gap \u2265 1","실패율 \u2265 40% (Gap=1) OR \u2265 20% (Gap=2)","수요 신호 있으나 우선순위 낮음 \u2014 예산\u00B7탁송비 여건 따라 판단"],
                ].map(([g,gap,fr,desc])=>(
                  <tr key={g}>
                    <td style={{padding:"5px 8px", fontWeight:500, color:g.startsWith("S")?"#791F1F":g.startsWith("A")?"#993C1D":"#633806"}}>{g}</td>
                    <td style={{padding:"5px 8px", color:"var(--color-text-secondary)"}}>{gap}</td>
                    <td style={{padding:"5px 8px", color:"var(--color-text-secondary)"}}>{fr}</td>
                    <td style={{padding:"5px 8px", color:"var(--color-text-tertiary)", fontSize:10}}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 데이터 필터 조건 */}
        <div>
          <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
            <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"var(--color-background-secondary)", fontSize:11, fontWeight:600, flexShrink:0}}>5</span>
            데이터 필터 조건 (노이즈 제거)
          </div>
          <div style={{background:"var(--color-background-secondary)", borderRadius:8, padding:"10px 14px", fontSize:11, color:"var(--color-text-secondary)", lineHeight:1.9}}>
            &middot; 일평균 클릭자수 3명 이상 &mdash; 너무 소규모 존 제외<br/>
            &middot; 데이터 집계 기간 60일 이상 &mdash; 신규 오픈 존 등 데이터 부족 존 제외<br/>
            &middot; 건당 이용시간 72h 이하 &mdash; 장기 렌탈성 이용으로 적정 대수가 비정상 과대 산출되는 존 제외<br/>
            &middot; 현재 운영 중인 존만 (carzone_info.state = 1, car_info.state = 5)<br/>
            &middot; 배차 조회 100건 이상 &mdash; 실패율 통계 신뢰도 확보
          </div>
        </div>

      </div>

      <div style={{marginTop:12, fontSize:11, color:"var(--color-text-tertiary)", lineHeight:1.7}}>
        &middot; &#9888; 이용시간 왜곡 의심 존은 장기 렌탈 패턴 확인 후 최종 판단 권장<br/>
        &middot; 아산역 2번출구(Gap +9)는 별도 주차 면수 확대 또는 인근 신규존 검토 권장<br/>
        &middot; 데이터 출처: socar-data BigQuery (aggregate_zone_funnel, reservation_info, car_info, log_get_car_classes)
      </div>
    </div>
  );
}
