import { useEffect, useRef } from "react";
import Matter from "matter-js";

const WALL_THICKNESS = 100;
const LABEL_DISTANCE_X_DELTA = -45;
const LABEL_DISTANCE_Y_DELTA = 50;
const ADDITIONAL_WALL_HEIGHT = 0;
const RESOURCE_PATH = process.env.PUBLIC_URL + "/contents-design-birthday";

export default function ItemBox({
    width = 600,
    height = 600,
    backgroundColor = "transparent",
    wallColor = "transparent",
    messages = [],
    presents = [],
    onSelectMessage,
    onSelectPresent,
    ...props
}) {
    const containerRef = useRef();
    const canvasRef = useRef();

    height += ADDITIONAL_WALL_HEIGHT;
    useEffect(() => {
        let Engine = Matter.Engine;
        let Render = Matter.Render;
        let World = Matter.World;
        let Bodies = Matter.Bodies;

        let engine = Engine.create();

        let render = Render.create({
            element: containerRef.current,
            engine: engine,
            canvas: canvasRef.current,
            options: {
                width,
                height,
                background: backgroundColor,
                wireframes: false
            }
        });

        
        const floor = Bodies.rectangle(width/2, height, width, WALL_THICKNESS, {
            id: 10000,
            label: "wall",
            isStatic: true,
            render: {
                fillStyle: wallColor
            }
        })

        const leftWall = Bodies.rectangle(0, height/2, WALL_THICKNESS, height, {
            id: 10001,
            label: "wall",
            isStatic: true,
            render: {
                fillStyle: wallColor
            }
        })

        const rightWall = Bodies.rectangle(width, height/2, WALL_THICKNESS, height, {
            id: 10002,
            label: "wall",
            isStatic: true,
            render: {
                fillStyle: wallColor
            }
        })

        const ceiling = Bodies.rectangle(width/2, 0, width, WALL_THICKNESS, {
            id: 10003,
            label: "wall",
            isStatic: true,
            render: {
                fillStyle: wallColor
            }
        })


        World.add(engine.world, [floor, leftWall, rightWall, ceiling]);

        const gameObjects = [];
        for (const { message_id, message_sender } of messages) {
            const randomX = Math.floor(Math.random() * width * 0.8) + 50;
            const randomAngle = Math.random();

            const textElement = document.createElement('div');
            textElement.className = "userSelectNone"
            textElement.innerText = message_sender;

            textElement.style.position = 'absolute';
            textElement.style.top = WALL_THICKNESS+30 + LABEL_DISTANCE_X_DELTA + 'px';
            textElement.style.left = randomX + LABEL_DISTANCE_Y_DELTA + 'px';
            textElement.style.fontSize = '20px';
            textElement.style.color = 'black';

            const message = Bodies.circle(randomX, WALL_THICKNESS+30, 50, {
                id: message_id,
                label: "message",
                restitution: 0.9, 
                friction: 1,
                angle: randomAngle,
                angularSpeed: 3,
                render: {
                    sprite: {
                        texture: RESOURCE_PATH + "/basiccake.png",
                        xScale: 0.3,
                        yScale: 0.3
                    }
                }
            });
            gameObjects.push([message, textElement]);
            document.body.appendChild(textElement);
            World.add(engine.world, message);
        }

        for (const { present_id, present_sender } of presents) {
            const randomX = Math.floor(Math.random() * width * 0.8) + 50;
            const randomAngle = Math.random();
            const textElement = document.createElement('div');
            textElement.className = "userSelectNone"
            textElement.innerText = present_sender;

            textElement.style.position = 'absolute';
            textElement.style.top = WALL_THICKNESS+30 + LABEL_DISTANCE_X_DELTA + 'px';
            textElement.style.left = randomX + LABEL_DISTANCE_Y_DELTA + 'px';
            textElement.style.fontSize = '20px';
            textElement.style.color = 'black';

            const sprite = randomX & 1 ? {
                texture: RESOURCE_PATH + "/giftbox_green.png",
                xScale: 0.4,
                yScale: 0.4
            } : {
                texture: RESOURCE_PATH + "/giftbox_red.png",
                xScale: 0.3,
                yScale: 0.3
            };

            const present = Bodies.circle(randomX, WALL_THICKNESS+30, 50, {
                id: present_id,
                label: "present",
                restitution: 0.9, 
                friction: 1,
                angle: randomAngle,
                angularSpeed: 3,
                render: {
                    sprite
                }
            });
            gameObjects.push([present, textElement]);
            document.body.appendChild(textElement);
            World.add(engine.world, present);
        }
        
        
        const canvas = canvasRef.current;
        const mouse = Matter.Mouse.create(canvas);

        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse,
            constraint: {
              stiffness: 0.1,
              render: {
                visible: false
              }
            }
        });


        // grabbing 효과를 제어하기 어려워서 사용하지 않을 듯
        // let isDragging = false;
        //
        // Matter.Events.on(mouseConstraint, "mousedown", (e) => {
        //     const mousePosition = e.mouse.position;
        //     const clickedBodies = Matter.Query.point(engine.world.bodies, mousePosition);
        //     if (clickedBodies.length > 0) {
        //         isDragging = true;
        //         console.log(clickedBodies[0]);
        //         canvas.style.cursor = "grabbing";
        //     }
        // })

        // Matter.Events.on(mouseConstraint, "mouseup", (e) => {
        //     const mousePosition = e.mouse.position;
        //     const clickedBodies = Matter.Query.point(engine.world.bodies, mousePosition);
        //     if (clickedBodies.length > 0) {
        //         canvas.style.cursor = "";
        //     }
        //     isDragging = false;
        // })


        Matter.Events.on(mouseConstraint, "mousemove", (e) => {
            const mousePosition = e.mouse.position;
            const clickedBodies = Matter.Query.point(engine.world.bodies, mousePosition);
            if (clickedBodies[0] && clickedBodies[0].label !== "wall") {
                canvas.className = "grab";
            }
            else {
                canvas.classList.remove("grab");
            }
        })

        Matter.Events.on(engine, "beforeUpdate", (e) => {
            const { left, top } = canvas.getBoundingClientRect();

            gameObjects.forEach(([item, textElement]) => {
                textElement.style.top = item.position.y + top + LABEL_DISTANCE_Y_DELTA + "px";
                textElement.style.left = item.position.x + left + LABEL_DISTANCE_X_DELTA + "px";
            })
        })

        mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
        World.add(engine.world, mouseConstraint);

        Matter.Runner.run(engine);
        Render.run(render);

        const handleDoubleClick = (e) => {
            const { left, top } = canvas.getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;
            const bodies = Matter.Query.point(engine.world.bodies, { x, y });
            if (bodies[0]) {
                if (bodies[0].label === "message" && onSelectMessage) {
                    onSelectMessage(bodies[0].id);
                }
                else if (bodies[0].label === "present" && onSelectPresent) {
                    onSelectPresent(bodies[0].id);
                }
            }

        }
        canvasRef.current?.addEventListener('dblclick', handleDoubleClick);

        return () => {
            canvasRef.current?.removeEventListener('dblclick', handleDoubleClick);
            document.querySelectorAll(".userSelectNone").forEach((element) => element.remove());
        }
        
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width,
                height,
                overflow: "hidden"
            }}
        >
            <canvas ref={canvasRef}/>
        </div>
    )
}