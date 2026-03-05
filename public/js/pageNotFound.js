let t1 = gsap.timeline();
let t2 = gsap.timeline();
    let t3 = gsap.timeline();
  
    t1.to(".page-nf-cog1",
    {
      transformOrigin:"50% 50%",
      rotation:"+=360",
      repeat:-1,
      ease:Linear.easeNone,
      duration:8
    });
  
    t2.to(".page-nf-cog2",
    {
      transformOrigin:"50% 50%",
      rotation:"-=360",
      repeat:-1,
      ease:Linear.easeNone,
      duration:8
    });
  
    t3.fromTo(".page-nf-wrong-para",
    {
      opacity:0
    },
    {
      opacity:1,
      duration:1,
      stagger:{
        repeat:-1,
        yoyo:true
      }
});