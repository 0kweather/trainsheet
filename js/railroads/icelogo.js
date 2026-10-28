// The ICE logo as the trains carry it: the "ICE" wordmark (DB's ICE-Logo.svg,
// its own shape, already leaning forward), drawn h ft tall at the caps,
// centered at (x, y) in a car's feet frame (y up). It reads and leans the
// same way on both sides: a mirrored car un-mirrors it, as the photographs
// of either side show. About 2.07 h wide.
const ICE_D = "M4.3579 4.9781c-0.4772,2.8024 0.6168,4.1979 3.1041,4.2241 0.8818,0.0092 1.8783,-0.2956 1.9975,-0.3663l0.229 -1.2432c-0.555,0.1967 -1.0499,0.3536 -1.7118,0.3412 -0.8359,-0.0157 -1.6762,-0.2365 -1.6981,-1.7361 -0.0315,-2.1452 0.7768,-3.9344 2.7285,-3.9707 0.6681,-0.0125 0.9846,0.1048 1.5886,0.3435l0.241 -1.3081c-0.4988,-0.2078 -0.8895,-0.3933 -2.0459,-0.4144 -2.4648,-0.0449 -4.0281,1.7523 -4.4329,4.13zm-3.6799 4.12l1.9109 -0.0011 1.4863 -8.0684 -1.9371 0 -1.4601 8.0695zm11.2907 -8.0695l-1.5412 8.0695 5.6172 -0.0006 0.2395 -1.3003 -3.7164 0 0.337 -2.0365 2.7499 0.0005 0.2488 -1.3508 -2.7181 -0.0018 0.4078 -1.9854 3.5066 -0.0002 0.2568 -1.3943 -5.3879 -0.0001z";
// The caps run from y 1.0286 to 9.0981 in the file (8.0695 tall), the
// letters from x 0.678 to 17.3566.
const CAP = 8.0695, CX = 9.0173, CY = 5.0634;
export const ICE_WIDTH = (17.3566 - 0.678) / CAP;
export const ICE_GREY = "#b4b4b4";
const r3 = v => Math.round(v * 1000) / 1000;
export const iceLogo = (c, x, y, h, fill = ICE_GREY) => {
  const k = h / CAP;
  return `<g transform="translate(${r3(x)} ${r3(y)}) scale(${r3((c.mirrored ? -1 : 1) * k)} ${r3(-k)}) translate(${-CX} ${-CY})">` +
    `<path fill="${fill}" d="${ICE_D}"/></g>`;
};
