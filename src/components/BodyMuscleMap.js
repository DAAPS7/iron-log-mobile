/**
 * Corpo estilizado (frente + costas) com cada zona muscular a ficar mais
 * opaca conforme o progresso semanal dessa zona. Formas simples (retângulos
 * arredondados/elipses) — não é anatomicamente perfeito, mas é claro e
 * reconhecível, o que é o que importa aqui.
 */

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { withAlpha } from '../theme/theme';

const NEUTRAL_OPACITY = 0.08; // zona sem nada planeado esta semana
const MIN_ACTIVE_OPACITY = 0.22; // zona planeada, ainda a 0% cumprido
const MAX_OPACITY = 1;

function opacityFor(region) {
  if (!region || region.plannedSets === 0) return NEUTRAL_OPACITY;
  return MIN_ACTIVE_OPACITY + region.progress * (MAX_OPACITY - MIN_ACTIVE_OPACITY);
}

/** Corpo de frente. Devolve os elementos SVG das zonas + o contorno neutro. */
function FrontBody({ progress, color, outline }) {
  const o = (key) => opacityFor(progress[key]);
  return (
    <Svg width={140} height={270} viewBox="0 0 140 270">
      {/* Contorno neutro (cabeça, pescoço, ancas, canelas, pés) */}
      <Circle cx={70} cy={18} r={14} fill={outline} />
      <Rect x={64} y={30} width={12} height={8} fill={outline} />
      <Rect x={52} y={110} width={36} height={14} rx={4} fill={outline} />
      <Rect x={54} y={184} width={12} height={62} rx={5} fill={outline} />
      <Rect x={74} y={184} width={12} height={62} rx={5} fill={outline} />
      <Ellipse cx={60} cy={250} rx={9} ry={5} fill={outline} />
      <Ellipse cx={80} cy={250} rx={9} ry={5} fill={outline} />

      {/* Zonas musculares */}
      <Ellipse cx={40} cy={46} rx={11} ry={9} fill={color} fillOpacity={o('shoulders_front')} />
      <Ellipse cx={100} cy={46} rx={11} ry={9} fill={color} fillOpacity={o('shoulders_front')} />
      <Rect x={50} y={38} width={40} height={30} rx={6} fill={color} fillOpacity={o('chest')} />
      <Rect x={55} y={68} width={30} height={42} rx={5} fill={color} fillOpacity={o('abs')} />
      <Rect x={27} y={44} width={12} height={38} rx={6} fill={color} fillOpacity={o('biceps')} />
      <Rect x={101} y={44} width={12} height={38} rx={6} fill={color} fillOpacity={o('biceps')} />
      <Rect x={25} y={82} width={11} height={36} rx={5} fill={color} fillOpacity={o('forearms')} />
      <Rect x={104} y={82} width={11} height={36} rx={5} fill={color} fillOpacity={o('forearms')} />
      <Rect x={52} y={124} width={15} height={60} rx={7} fill={color} fillOpacity={o('quads')} />
      <Rect x={73} y={124} width={15} height={60} rx={7} fill={color} fillOpacity={o('quads')} />
      <Rect x={66} y={124} width={8} height={45} rx={4} fill={color} fillOpacity={o('adductors')} />
    </Svg>
  );
}

/** Corpo de costas. */
function BackBody({ progress, color, outline }) {
  const o = (key) => opacityFor(progress[key]);
  return (
    <Svg width={140} height={270} viewBox="0 0 140 270">
      <Circle cx={70} cy={18} r={14} fill={outline} />
      <Rect x={64} y={30} width={12} height={8} fill={outline} />
      <Rect x={25} y={82} width={11} height={36} rx={5} fill={outline} />
      <Rect x={104} y={82} width={11} height={36} rx={5} fill={outline} />
      <Rect x={54} y={184} width={12} height={60} rx={5} fill={color} fillOpacity={o('calves')} />
      <Rect x={74} y={184} width={12} height={60} rx={5} fill={color} fillOpacity={o('calves')} />
      <Ellipse cx={60} cy={250} rx={9} ry={5} fill={outline} />
      <Ellipse cx={80} cy={250} rx={9} ry={5} fill={outline} />

      <Ellipse cx={40} cy={46} rx={11} ry={9} fill={color} fillOpacity={o('rear_delts')} />
      <Ellipse cx={100} cy={46} rx={11} ry={9} fill={color} fillOpacity={o('rear_delts')} />
      <Rect x={48} y={38} width={44} height={62} rx={8} fill={color} fillOpacity={o('back')} />
      <Rect x={27} y={44} width={12} height={38} rx={6} fill={color} fillOpacity={o('triceps')} />
      <Rect x={101} y={44} width={12} height={38} rx={6} fill={color} fillOpacity={o('triceps')} />
      <Rect x={50} y={100} width={40} height={26} rx={8} fill={color} fillOpacity={o('glutes')} />
      <Rect x={52} y={126} width={15} height={56} rx={7} fill={color} fillOpacity={o('hamstrings')} />
      <Rect x={73} y={126} width={15} height={56} rx={7} fill={color} fillOpacity={o('hamstrings')} />
    </Svg>
  );
}

/**
 * @param {Object} progress  resultado de computeMuscleRegionProgress()
 * @param {(regionKey: string) => void} [onPressRegion]  opcional, ex: para ver detalhe
 */
export default function BodyMuscleMap({ progress }) {
  const theme = useTheme();
  const color = theme.colors.strength;
  const outline = theme.colors.bgSoft;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}>
          <FrontBody progress={progress} color={color} outline={outline} />
          <Text style={{ color: theme.colors.muted, fontFamily: theme.font.body, fontSize: 11, marginTop: 4 }}>
            Frente
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <BackBody progress={progress} color={color} outline={outline} />
          <Text style={{ color: theme.colors.muted, fontFamily: theme.font.body, fontSize: 11, marginTop: 4 }}>
            Costas
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: withAlpha(color, MIN_ACTIVE_OPACITY),
            }}
          />
          <Text style={{ color: theme.colors.muted, fontFamily: theme.font.body, fontSize: 11 }}>Por começar</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: withAlpha(color, MAX_OPACITY),
            }}
          />
          <Text style={{ color: theme.colors.muted, fontFamily: theme.font.body, fontSize: 11 }}>Semana cumprida</Text>
        </View>
      </View>
    </View>
  );
}
