import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import Circles from '../../assets/patterns/circles.svg';
import Cross from '../../assets/patterns/cross.svg';
import Cubes from '../../assets/patterns/cubes.svg';
import Diagonal from '../../assets/patterns/diagonal.svg';
import Dots from '../../assets/patterns/dots.svg';
import Grid from '../../assets/patterns/grid.svg';
import Lines from '../../assets/patterns/lines.svg';
import Squares from '../../assets/patterns/squares.svg';
import Triangles from '../../assets/patterns/triangles.svg';
import Zigzag from '../../assets/patterns/zigzag.svg';
const WhatsappPng = require('../../assets/patterns/whatsapp.png');

interface Props {
  patternName: string;
  opacity?: number;
}

export const ChatBackground = ({ patternName, opacity = 0.08 }: Props) => {
  if (!patternName || patternName === 'none') return null;

  if (patternName === 'whatsapp') {
    return (
      <View style={[StyleSheet.absoluteFill, { opacity: 0.15, backgroundColor: 'transparent' }]}>
        <Image
          source={WhatsappPng}
          style={{ width: '100%', height: '100%', resizeMode: 'repeat' }}
        />
      </View>
    );
  }

  const SvgComponent = getSvgComponent(patternName);
  if (!SvgComponent) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}>
      {/* We use a simple repeating trick for SVG since resizeMode="repeat" is for Image */}
      {/* For a true repeating background, SVG would need pattern definitions, but for simplicity we render one large SVG or tile it */}
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.5 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <SvgComponent key={i} width={100} height={100} style={{ margin: -1 }} />
        ))}
      </View>
    </View>
  );
};

const getSvgComponent = (name: string) => {
  switch (name) {
    case 'circles': return Circles;
    case 'cross': return Cross;
    case 'cubes': return Cubes;
    case 'diagonal': return Diagonal;
    case 'dots': return Dots;
    case 'grid': return Grid;
    case 'lines': return Lines;
    case 'squares': return Squares;
    case 'triangles': return Triangles;
    case 'zigzag': return Zigzag;
    default: return null;
  }
};
