import React, { useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components and the annotation plugin
ChartJS.register(...registerables, annotationPlugin);

function PriceRangeChart({ price }) {
  const [minPrice, setMinPrice] = useState(-50);
  const [maxPrice, setMaxPrice] = useState(50);
  const elementRef = useRef();
  const lastEventRef = useRef();

  const drag = (moveX, moveY) => {
    elementRef.current.x += moveX;
    elementRef.current.y += moveY;
    elementRef.current.x2 += moveX;
    elementRef.current.y2 += moveY;
    elementRef.current.centerX += moveX;
    elementRef.current.centerY += moveY;
    if (elementRef.current.elements && elementRef.current.elements.length) {
      for (const subEl of elementRef.current.elements) {
        subEl.x += moveX;
        subEl.y += moveY;
        subEl.x2 += moveX;
        subEl.y2 += moveY;
        subEl.centerX += moveX;
        subEl.centerY += moveY;
        subEl.bX += moveX;
        subEl.bY += moveY;
      }
    }
  };

  const handleElementDragging = (event) => {
    if (!lastEventRef.current || !elementRef.current) {
      return;
    }

    const moveX = event.x - lastEventRef.current.x;

    // Restrict dragging to the x-axis only
    drag(moveX, 0);

    lastEventRef.current = event;
    return true;
  };

  const handleDrag = (event) => {
    if (elementRef.current && (elementRef.current.options.id === 'maxPriceLine' || elementRef.current.options.id === 'minPriceLine')) {
      switch (event.type) {
        case 'mousemove':
          return handleElementDragging(event);
        case 'mouseout':
        case 'mouseup':
          lastEventRef.current = undefined;
          break;
        case 'mousedown':
          lastEventRef.current = event;
          break;
        default:
      }
    }
  };

  const handleEnter = (ctx) => {
    elementRef.current = ctx.element;
  };

  const handleLeave = () => {
    elementRef.current = undefined;
    lastEventRef.current = undefined;
  };

  const dragger = {
    id: 'dragger',
    beforeEvent(chart, args, options) {
      if (handleDrag(args.event)) {
        args.changed = true;
      }
    },
  };

  // Dummy data for the price distribution
  const priceData = Array.from({ length: 101 }, () => Math.floor(Math.random() * 100));

  const data = {
    labels: Array.from({ length: 101 }, (_, i) => (((i) / 50) * price).toFixed(2)),
    datasets: [
      {
        label: 'Price Distribution',
        data: priceData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Price',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
        },
      },
    },
    plugins: {
      annotation: {
        enter(ctx) {
          handleEnter(ctx);
        },
        leave() {
          handleLeave();
        },
        clip: false,
        annotations: {
          currentPriceLine: {
            type: 'box',
            xMin: 50,
            xMax: 50,
            yMin: 0,
            yMax: 100,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderDash: [10, 5],
          },
          minPriceLine: {
            type: 'box',
            xMin: minPrice + 50,
            xMax: minPrice + 50,
            yMin: 0,
            yMax: 100,
            borderColor: 'red',
            borderWidth: 2,
            draggable: true,
            onDragStart: (context) => {
              console.log('Drag start');
            },
            onDragEnd: (context) => {
              const newValue = context.chart.scales.x.getValueForPixel(context.event.x);
              setMinPrice(newValue - 50);
            },
            label: {
              content: () => `Min: ${minPrice.toFixed(2)}`,
              display: true,
              color: 'white',
              position: 'start',
            },
          },
          maxPriceLine: {
            type: 'box',
            xMin: maxPrice + 50,
            xMax: maxPrice + 50,
            yMin: 0,
            yMax: 100,
            borderColor: 'green',
            borderWidth: 2,
            draggable: true,
            onDragStart: (context) => {
              console.log('Drag start');
            },
            onDragEnd: (context) => {
              const newValue = context.chart.scales.x.getValueForPixel(context.event.x);
              setMaxPrice(newValue - 50);
            },
            label: {
              content: () => `Max: ${maxPrice.toFixed(2)}`,
              display: true,
              color: 'white',
              position: 'end',
            },
          },
        },
      },
    },
    events: ['mousedown', 'mouseup', 'mousemove', 'mouseout'],
  };

  const handleDragEndMin = (context) => {
    let newValue = context.chart.scales.x.getValueForPixel(context.event.x);
    // Restricting to the range of -50 to 50
    newValue = Math.max(-50, Math.min(50, newValue));
    setMinPrice(newValue - 50);
  };

  const handleDragEndMax = (context) => {
    let newValue = context.chart.scales.x.getValueForPixel(context.event.x);
    // Restricting to the range of -50 to 50
    newValue = Math.max(-50, Math.min(50, newValue));
    setMaxPrice(newValue - 50);
  };

  return (
    <div style={{ margin: 'auto' }}>
      <h2>Price Range Chart</h2>
      <div style={{ position: 'relative', height: '300px' }}>
        <Bar data={data} options={options} plugins={[dragger]} />
      </div>
    </div>
  );
}

export default PriceRangeChart;
