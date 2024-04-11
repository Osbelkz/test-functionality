import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useYMaps} from "@pbe/react-yandex-maps";
import {Button} from "antd";
import ymaps from "yandex-maps";

const MapComponent = () => {
    const mapRef = useRef<any | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawButtonRef = useRef<HTMLButtonElement | null>(null);
    const ymaps = useYMaps(['Map', "Placemark", "Polygon", 'geoQuery']);
    const [map, setMap] = useState<ymaps.Map | null>(null)
    const [objects, setObjects] = useState<any[]>([])
    const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
    const [selectedPointIds, setSelectedPointIds] = useState<number[]>([]);

    const [polygon, setPolygon] = useState<ymaps.Polygon | null>(null);

    const placeMarksData = [
        {
            id: 1,
            type: 'Point',
            coordinates: [51.093761, 71.427233]
        },
        {
            id: 8,
            type: 'Point',
            coordinates: [51.089298, 71.416054]
        },
        {
            id: 4,
            type: 'Point',
            coordinates: [51.106408, 71.416187]
        },
        {
            id: 3,
            type: 'Point',
            coordinates: [51.095, 71.43]
        },
        {
            id: 11,
            type: 'Point',
            coordinates: [51.098, 71.40]
        }
    ]

    const onClick = useCallback(async (e: ymaps.IEvent<{}, ymaps.geometry.Point>) => {
        // todo: костыль для получения значений по id точек
        let areaIds: any[] = [];
        let pointIds: any[] = [];
        await setSelectedPointIds((prevState) => {
            pointIds = prevState
            return prevState
        })
        await setSelectedAreaIds((prevState) => {
            areaIds = prevState
            return prevState
        })

        const point = e.get('target');
        const pointId = point.properties.get('id')
        if (!areaIds.includes(pointId) && !pointIds.includes(pointId)) {
            setSelectedPointIds((prevState) => [...prevState, pointId]);
            point.options.set('preset', 'islands#redIcon');
        } else if (pointIds.includes(pointId)) {
            setSelectedPointIds((prevState) => prevState.filter((id) => id !== pointId));
            point.options.set('preset', 'islands#blueIcon');
        } else {
            return;
        }
    }, [selectedAreaIds, selectedPointIds])

    useEffect(() => {
        if (!ymaps || !mapRef.current) {
            return;
        }

        const ymap = new ymaps.Map(mapRef.current, {
            center: [51.131458, 71.445559],
            zoom: 10,
        });
        setMap(ymap)

        const placemarks = placeMarksData.map((data) => {
            const placemark = new ymaps.Placemark(data.coordinates, {
                id: data.id
            })

            placemark.events.add(['click'], onClick)

            return placemark;
        })

        // @ts-ignore
        const objects = ymaps.geoQuery(placemarks).addToMap(ymap)

        setObjects(objects)
    }, [ymaps]);

    const polygonOptions = {
        strokeColor: '#0000ff',
        fillColor: '#8080ff',
        interactivityModel: 'default#transparent',
        strokeWidth: 4,
        opacity: 0.7
    };

    const canvasOptions = {
        strokeStyle: '#0000ff',
        lineWidth: 4,
        opacity: 0.7
    };

    const onDraw = () => {

        if (map && ymaps) {
            // @ts-ignore
            // drawButtonRef.current?.disabled = true;
            // drawButton.disabled = true;

            // @ts-ignore
            drawLineOverMap(map)
                // @ts-ignore
                .then((coordinates: any[]) => {
                    // Переводим координаты из 0..1 в географические.
                    const bounds = map.getBounds()
                    coordinates = coordinates.map(function (x) {
                        return [
                            // Широта (latitude).
                            // Y переворачивается, т.к. на canvas'е он направлен вниз.
                            bounds[0][0] + (1 - x[1]) * (bounds[1][0] - bounds[0][0]),
                            // Долгота (longitude).
                            bounds[0][1] + x[0] * (bounds[1][1] - bounds[0][1]),
                        ];
                    });

                    // Тут надо симплифицировать линию.
                    // Для простоты я оставляю только каждую третью координату.
                    coordinates = coordinates.filter(function (_, index) {
                        return index % 3 === 0;
                    });

                    // Удаляем старый полигон.
                    if (polygon) {
                        map.geoObjects.remove(polygon);
                    }
                    // Создаем новый полигон
                    const newPolygon = new ymaps.Polygon([coordinates], {}, polygonOptions);
                    setPolygon(newPolygon)

                    map.geoObjects.add(newPolygon);

                    // Ищем все объекты внутри полигона
                    // @ts-ignore
                    const objectsInsideCircle = objects.searchInside(newPolygon)
                    // Ids объектов внутри полигона
                    const ids = objectsInsideCircle._objects.map((x: any) => {
                        const id = x.properties.get("id")
                        // Если id уже выбран, то удаляем его из выбранных PointIds
                        if (selectedPointIds.includes(id)) {
                            setSelectedPointIds((prevState) => prevState.filter((x) => x !== id))
                        }
                        return x.properties.get("id")
                    })

                    setSelectedAreaIds(ids)
                    objectsInsideCircle.setOptions('preset', 'islands#redIcon');

                    // Ищем все точки, которые находятся внутри полигона
                    // @ts-ignore
                    const filtered = objects._objects.filter((x: any) => {
                        const id = x.properties.get("id")
                        return selectedPointIds.includes(id);
                    })

                    // устанавливаем стандартную иконку для всех точек, которые не были выделены областью и выбраными индивидуально кликом
                    // @ts-ignore
                    objects.remove(objectsInsideCircle).remove(filtered).setOptions('preset', 'islands#blueIcon');


                    // @ts-ignore
                    // drawButtonRef.current?.disabled = false;
                });
        }
    }

    function drawLineOverMap(map: ymaps.Map) {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            let ctx2d = canvasRef.current.getContext('2d');
            let drawing = false;
            let coordinates: any[] = [];

            // Задаем размеры канвасу как у карты.
            let rect = map.container.getParentElement().getBoundingClientRect();
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Применяем стили.
            ctx2d!.strokeStyle = canvasOptions.strokeStyle;
            ctx2d!.lineWidth = canvasOptions.lineWidth;
            canvas.style.opacity = String(canvasOptions.opacity);

            ctx2d!.clearRect(0, 0, canvas.width, canvas.height);

            // Показываем канвас. Он будет сверху карты из-за position: absolute.
            canvas.style.display = 'block';

            canvas.onmousedown = function (e) {
                // При нажатии мыши запоминаем, что мы начали рисовать и координаты.
                drawing = true;
                coordinates.push([e.offsetX, e.offsetY]);
            };

            canvas.onmousemove = function (e) {
                // При движении мыши запоминаем координаты и рисуем линию.
                if (drawing) {
                    var last = coordinates[coordinates.length - 1];
                    ctx2d!.beginPath();
                    ctx2d!.moveTo(last[0], last[1]);
                    ctx2d!.lineTo(e.offsetX, e.offsetY);
                    ctx2d!.stroke();

                    coordinates.push([e.offsetX, e.offsetY]);
                }
            };

            return new Promise(function (resolve) {
                // При отпускании мыши запоминаем координаты и скрываем канвас.
                canvas.onmouseup = function (e) {
                    coordinates.push([e.offsetX, e.offsetY]);
                    canvas.style.display = 'none';
                    drawing = false;

                    coordinates = coordinates.map(function (x) {
                        return [x[0] / canvas.width, x[1] / canvas.height];
                    });

                    resolve(coordinates);
                };
            });
        }

    }

    return (
        <>
            <Button onClick={onDraw} ref={drawButtonRef}>
                Обвести область
            </Button>
            <div>Selected IDs: {selectedAreaIds.join(", ")}</div>
            <div>Selected Point IDs: {selectedPointIds.join(", ")}</div>
            <div id="container" style={{position: "relative"}}>
                <div
                    ref={mapRef}
                    style={{width: "800px", height: "600px"}}
                >

                </div>
                <canvas ref={canvasRef} style={{position: "absolute", left: 0, top: 0, display: "none"}}></canvas>
            </div>
        </>
    );
};

export default MapComponent;