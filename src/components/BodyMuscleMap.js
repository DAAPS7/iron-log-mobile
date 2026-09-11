/**
 * Corpo humano (frente + costas) com cada zona muscular a ficar mais opaca
 * conforme o progresso semanal dessa zona. As formas usam curvas (não só
 * retângulos) para se assemelharem mais a um corpo real, inspiradas na
 * convenção comum de diagramas musculares de ginásio — mas desenhadas de
 * raiz, não copiadas de nenhuma imagem existente.
 */

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { withAlpha } from '../theme/theme';

const NEUTRAL_OPACITY = 0.1; // zona sem nada planeado esta semana
const MIN_ACTIVE_OPACITY = 0.25; // zona planeada, ainda a 0% cumprido
const MAX_OPACITY = 1;

function opacityFor(region) {
  if (!region || region.plannedSets === 0) return NEUTRAL_OPACITY;
  return MIN_ACTIVE_OPACITY + region.progress * (MAX_OPACITY - MIN_ACTIVE_OPACITY);
}

/** Corpo de frente. */
function FrontBody({ progress, color, outline }) {
  const o = (key) => opacityFor(progress[key]);
  return (
    <Svg width={150} height={345} viewBox="0 0 200 460">
      {/* Partes neutras (não são "músculo" no sentido de treino) */}
      <Ellipse cx={100} cy={35} rx={26} ry={30} fill={outline} />
      <Path d="M86 60 L114 60 L110 76 L90 76 Z" fill={outline} />
      <Path d="M84 230 L116 230 L120 245 L80 245 Z" fill={outline} />
      <Path d="M58 372 L86 372 L82 425 C80 432,64 432,62 425 Z" fill={outline} />
      <Path d="M142 372 L114 372 L118 425 C120 432,136 432,138 425 Z" fill={outline} />
      <Ellipse cx={70} cy={438} rx={16} ry={9} fill={outline} />
      <Ellipse cx={130} cy={438} rx={16} ry={9} fill={outline} />

      {/* Ombros (deltóides frontais) */}
      <Ellipse cx={38} cy={95} rx={22} ry={26} fill={color} fillOpacity={o('shoulders_front')} />
      <Ellipse cx={162} cy={95} rx={22} ry={26} fill={color} fillOpacity={o('shoulders_front')} />

      {/* Peito (dois lados, separados ao centro) */}
      <Path
        d="M60 88 C48 92,42 105,44 122 C46 135,58 145,75 145 C85 145,92 138,94 125 L94 90 C88 84,72 82,60 88 Z"
        fill={color}
        fillOpacity={o('chest')}
      />
      <Path
        d="M140 88 C152 92,158 105,156 122 C154 135,142 145,125 145 C115 145,108 138,106 125 L106 90 C112 84,128 82,140 88 Z"
        fill={color}
        fillOpacity={o('chest')}
      />

      {/* Abdominais */}
      <Path
        d="M78 145 L122 145 L116 230 C110 240,90 240,84 230 Z"
        fill={color}
        fillOpacity={o('abs')}
      />

      {/* Bicípites */}
      <Path
        d="M20 110 C14 112,10 128,12 148 C14 168,18 185,26 195 L46 195 C50 175,50 150,46 122 C44 110,32 106,20 110 Z"
        fill={color}
        fillOpacity={o('biceps')}
      />
      <Path
        d="M180 110 C186 112,190 128,188 148 C186 168,182 185,174 195 L154 195 C150 175,150 150,154 122 C156 110,168 106,180 110 Z"
        fill={color}
        fillOpacity={o('biceps')}
      />

      {/* Antebraços */}
      <Path d="M24 195 L46 195 L40 250 C38 258,28 258,26 250 Z" fill={color} fillOpacity={o('forearms')} />
      <Path d="M176 195 L154 195 L160 250 C162 258,172 258,174 250 Z" fill={color} fillOpacity={o('forearms')} />
      <Ellipse cx={33} cy={262} rx={11} ry={14} fill={outline} />
      <Ellipse cx={167} cy={262} rx={11} ry={14} fill={outline} />

      {/* Quadríceps */}
      <Path
        d="M70 245 C62 245,56 262,56 290 L52 350 C52 365,62 372,72 372 L82 372 C90 372,94 365,92 350 L90 290 C90 265,82 248,70 245 Z"
        fill={color}
        fillOpacity={o('quads')}
      />
      <Path
        d="M130 245 C138 245,144 262,144 290 L148 350 C148 365,138 372,128 372 L118 372 C110 372,106 365,108 350 L110 290 C110 265,118 248,130 245 Z"
        fill={color}
        fillOpacity={o('quads')}
      />

      {/* Adutores (interior da coxa) */}
      <Path d="M92 258 L108 258 L106 340 C102 347,98 347,94 340 Z" fill={color} fillOpacity={o('adductors')} />
    </Svg>
  );
}

/** Corpo de costas. */
function BackBody({ progress, color, outline }) {
  const o = (key) => opacityFor(progress[key]);
  return (
    <Svg width={150} height={345} viewBox="0 0 200 460">
      <Ellipse cx={100} cy={35} rx={26} ry={30} fill={outline} />
      <Path d="M86 60 L114 60 L110 76 L90 76 Z" fill={outline} />
      <Path d="M24 195 L46 195 L40 250 C38 258,28 258,26 250 Z" fill={outline} />
      <Path d="M176 195 L154 195 L160 250 C162 258,172 258,174 250 Z" fill={outline} />
      <Ellipse cx={33} cy={262} rx={11} ry={14} fill={outline} />
      <Ellipse cx={167} cy={262} rx={11} ry={14} fill={outline} />
      <Ellipse cx={70} cy={438} rx={16} ry={9} fill={outline} />
      <Ellipse cx={130} cy={438} rx={16} ry={9} fill={outline} />

      {/* Trapézio + costas/dorsais (mesma zona de dados: "Costas") */}
      <Path
        d="M90 76 L110 76 L140 105 C130 100,115 96,100 96 C85 96,70 100,60 105 Z"
        fill={color}
        fillOpacity={o('back')}
      />
      <Path
        d="M60 100 C48 110,44 140,48 175 C52 205,65 225,85 232 L115 232 C135 225,148 205,152 175 C156 140,152 110,140 100 C125 115,110 125,100 125 C90 125,75 115,60 100 Z"
        fill={color}
        fillOpacity={o('back')}
      />

      {/* Deltóides posteriores */}
      <Ellipse cx={38} cy={95} rx={22} ry={26} fill={color} fillOpacity={o('rear_delts')} />
      <Ellipse cx={162} cy={95} rx={22} ry={26} fill={color} fillOpacity={o('rear_delts')} />

      {/* Tricípites */}
      <Path
        d="M20 110 C14 112,10 128,12 148 C14 168,18 185,26 195 L46 195 C50 175,50 150,46 122 C44 110,32 106,20 110 Z"
        fill={color}
        fillOpacity={o('triceps')}
      />
      <Path
        d="M180 110 C186 112,190 128,188 148 C186 168,182 185,174 195 L154 195 C150 175,150 150,154 122 C156 110,168 106,180 110 Z"
        fill={color}
        fillOpacity={o('triceps')}
      />

      {/* Glúteos */}
      <Path
        d="M68 232 C60 232,55 250,58 265 C62 280,80 285,100 285 C120 285,138 280,142 265 C145 250,140 232,132 232 Z"
        fill={color}
        fillOpacity={o('glutes')}
      />

      {/* Isquiotibiais */}
      <Path
        d="M70 265 C62 265,56 280,56 305 L52 350 C52 365,62 372,72 372 L82 372 C90 372,94 365,92 350 L90 305 C90 285,82 268,70 265 Z"
        fill={color}
        fillOpacity={o('hamstrings')}
      />
      <Path
        d="M130 265 C138 265,144 280,144 305 L148 350 C148 365,138 372,128 372 L118 372 C110 372,106 365,108 350 L110 305 C110 285,118 268,130 265 Z"
        fill={color}
        fillOpacity={o('hamstrings')}
      />

      {/* Gémeos */}
      <Path
        d="M58 372 L86 372 L82 425 C80 432,64 432,62 425 Z"
        fill={color}
        fillOpacity={o('calves')}
      />
      <Path
        d="M142 372 L114 372 L118 425 C120 432,136 432,138 425 Z"
        fill={color}
        fillOpacity={o('calves')}
      />
    </Svg>
  );
}

/** @param {Object} progress  resultado de computeMuscleRegionProgress() */
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
