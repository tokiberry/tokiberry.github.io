(function($) {
    let bShakeTreeEnabled = false;
    let leafPile = [];
    let curMouseX = null;
    let curMouseY = null;
    
    const treeSection = document.querySelector(".tree");
    treeSection.onmousemove = handleMouseMove;
    
    function handleMouseMove(event)
    {
        const bounds = treeSection.getBoundingClientRect();
        curMouseX = event.clientX - bounds.left;
        curMouseY = event.clientY - bounds.top;
    }
    
    const treeCanopy = document.getElementById("canopy");
    const treeCanopyLeaves = document.getElementById("canopy-leaves");
    function addCanopyListeners()
    {
        treeCanopy.style.pointerEvents = "auto";
        
        treeCanopy.addEventListener("mouseenter", handleCanopyMouseEnter);
        treeCanopy.addEventListener("mouseleave", handleCanopyMouseLeave);
        treeCanopy.addEventListener( "click", handleCanopyClick);
    }
    
    addCanopyListeners();
    
    function handleCanopyMouseEnter()
    {
        startTreeShake();
    }
    
    function handleCanopyMouseLeave()
    {
        stopTreeShake();
    }
    
    function handleCanopyClick()
    {
        treeCanopy.removeEventListener("mouseenter", handleCanopyMouseEnter);
        treeCanopy.removeEventListener("mouseleave", handleCanopyMouseLeave);
        treeCanopy.removeEventListener("click", handleCanopyClick);
        
        treeCanopy.style.pointerEvents = "none";
        collapseCanopy();
    }
    
    function startTreeShake()
    {
        bShakeTreeEnabled = true;
        
        gsap.to("#canopy",{
            keyframes: {
                rotation: [0, -2, 2, -1.5, 1.5, -0.5, 0.5, 0],
            },
            duration: gsap.utils.random(0.5, 1),
            repeat: -1
        });
        
        loopSpawn();
    }
    
    function stopTreeShake()
    {
        bShakeTreeEnabled = false;
        gsap.killTweensOf("#canopy");
    }
    
    // Colors used for the leaf svg instances
    const leafPalette = ['#4a7c3f', '#6fa84f', '#8fbf5a', '#c9de7c', '#e8d878'];

    function leafSVG(color) 
    {
        return `
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 1 C23 6 24 18 14 27 C2 18 4 6 14 1 Z" fill="${color}"/>
                <path d="M14 3 L14 23" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
            </svg>
        `;
    }
    
    const stage = document.getElementById("leaf-stage");
    
    function makeNewLeaf(startX, startY)
    {
        const leafElem = document.createElement("newLeaf");
        leafElem.className = "leaf";

        const color = leafPalette[Math.floor(Math.random() * leafPalette.length)];
        leafElem.innerHTML = leafSVG(color);

        const size = gsap.utils.random(16, 30);
        leafElem.style.width = size + 'px';
        leafElem.style.height = size + 'px';

        gsap.set(leafElem, { x: startX, y: startY, rotation: gsap.utils.random(0, 360) });
        stage.appendChild(leafElem);
        
        return leafElem;
    }
    
    function spawnFallingLeaf()
    {
        const bounds = treeSection.getBoundingClientRect();
        const maxYSpawn = bounds.height * 0.5;
        const startX = curMouseX != null ? curMouseX : gsap.utils.random(0, bounds.width);
        const startY = curMouseY > maxYSpawn ? maxYSpawn : curMouseY;
        const leaf = makeNewLeaf(startX, startY);
        
        const heightModifier = (bounds.height - startY) / bounds.height;
        const fallDuration = gsap.utils.random(6, 11) * heightModifier;
        const driftDistance = gsap.utils.random(80, 220) * (Math.random() < 0.5 ? -1 : 1) * heightModifier;
        const swayCount = Math.round(gsap.utils.random(3, 6) * heightModifier);
        const rotations = gsap.utils.random(1, 3) * (Math.random() < 0.5 ? -1 : 1) * heightModifier;

        const tl = gsap.timeline({
            onComplete: () => leaf.remove()
        });

        tl.to(leaf, {
            y: bounds.height + 40,
            duration: fallDuration,
            ease: 'power1.in'
        }, 0);

        tl.to(leaf, {
            x: `+=${driftDistance}`,
            duration: fallDuration / (swayCount + 1),
            ease: 'sine.inOut',
            repeat: swayCount,
            yoyo: true
        }, 0);

        tl.to(leaf, {
            rotation: `+=${rotations * 360}`,
            duration: fallDuration,
            ease: 'none'
        }, 0);

        tl.to(leaf, {
            opacity: 0.85,
            duration: 0.6
        }, 0);
    }
    function spawnFallingPileLeaf() 
    {
        const bounds = treeSection.getBoundingClientRect();
        const startX = gsap.utils.random(bounds.width * 0.1, bounds.width * 0.9);
        const startY = gsap.utils.random(bounds.height * 0.1, bounds.height * 0.6);
        const leaf = makeNewLeaf(startX, startY);
        
        const tl = gsap.timeline({ delay: gsap.utils.random(0, 0.5) });
        tl.to(leaf, {
            y: bounds.height * 0.95 + gsap.utils.random(-6, 6),
            rotation: `+=${gsap.utils.random(180, 540) * (Math.random() < 0.5 ? -1 : 1)}`,
            duration: gsap.utils.random(0.7, 1.3),
            ease: 'power2.in'
        }, 0)
        
        // small settle bounce once it "lands"
        .to(leaf, {
            x: `+=${gsap.utils.random(-20, 20)}`,
            duration: 0.25,
            ease: 'power1.out'
        });
        
        return leaf;
    }

    function loopSpawn() {

        if (bShakeTreeEnabled)
        {
            spawnFallingLeaf();
            gsap.delayedCall(gsap.utils.random(0.15, 0.6), loopSpawn);
        }
    }

    function collapseCanopy()
    {
        stopTreeShake();
        
        const leafCount = 100;
        for (let i = 0; i < leafCount; ++i)
        {
            leafPile.push(spawnFallingPileLeaf());
        }
        
        gsap.to([treeCanopy, treeCanopyLeaves], {
            opacity: 0,
            scale: 0.75,
            y: 20,
            transformOrigin: '50% 100%',
            duration: 0.5,
            ease: "power3.in",
        });
        
        gsap.delayedCall(1.6, () => spawnFlower());
    }

    const flowerPalette = ['#e8879e', '#5e0913', '#f4f1de', '#c86b98'];
    function flowerSVG(color) 
    {
        return `
            <svg width="20" height="34" viewBox="0 0 20 34" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="12" x2="10" y2="34" stroke="#4a7c3f" stroke-width="2" stroke-linecap="round"/>
              <path d="M10 34 Q4 30 6 24" stroke="#4a7c3f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <g fill="${color}">
                <ellipse cx="10" cy="5" rx="3.4" ry="4.4"/>
                <ellipse cx="15" cy="10" rx="4.4" ry="3.4"/>
                <ellipse cx="10" cy="15" rx="3.4" ry="4.4"/>
                <ellipse cx="5" cy="10" rx="4.4" ry="3.4"/>
              </g>
              <circle cx="10" cy="10" r="2.6" fill="#f2c14e"/>
            </svg>
          `;
    }
    function spawnFlower()
    {
        const bounds = treeSection.getBoundingClientRect();
        const spawnX = (bounds.width >> 1) + gsap.utils.random(-100, 100);
        const flowerElem = document.createElement("div");
        flowerElem.className = "flower";

        const color = flowerPalette[Math.floor(Math.random() * flowerPalette.length)];
        flowerElem.innerHTML = flowerSVG(color);

        const size = 64;
        flowerElem.style.width = (size * 20 / 34) + "px";
        flowerElem.style.height = size + "px";

        gsap.set(flowerElem, { x: spawnX, scale: 0, rotation: gsap.utils.random(-8, 8) });
        stage.appendChild(flowerElem);

        gsap.timeline()
            .to(flowerElem, {
                scale: 1,
                duration: 0.5,
                ease: 'back.out(2.5)' // slight overshoot pop, like it's springing up from the ground
            })
            .to(flowerElem, {
                rotation: `+=${gsap.utils.random(-4, 4)}`,
                duration: 1.2,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });
        
        flowerElem.addEventListener("click", (event)=>{
            handleFlowerClick(flowerElem);
        });
    }
    
    function handleFlowerClick(inFlower)
    {
        inFlower.removeEventListener("click", handleFlowerClick);
        inFlower.remove();
        
        // remove leaf pile
        while (leafPile.length > 0)
        {
            let curLeaf = leafPile.pop();
            curLeaf.remove();
        }
        
        restoreCanopy();
    }
    
    function restoreCanopy()
    {
        gsap.to([treeCanopy, treeCanopyLeaves], {
            opacity: 1,
            scale: 1,
            y: 0,
            transformOrigin: '50% 100%',
            duration: 0.1,
            ease: "power3.in",
        });
        
        addCanopyListeners();
    }
    
})(jQuery);