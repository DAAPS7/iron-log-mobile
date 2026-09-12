import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  BigStat,
  Body,
  Button,
  Card,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Note,
  Screen,
  ScreenTitle,
  SegmentedControl,
} from '../components/ui';
import StatRing from '../components/StatRing';
import MetricInsightModal from '../components/MetricInsightModal';
import BodyMuscleMap from '../components/BodyMuscleMap';
import Icon from '../components/Icon';
import HeroCard from '../components/HeroCard';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { todayLocal } from '../lib/date';
import { evaluateAllGoals } from '../lib/goals';
import { computeMuscleRegionProgress } from '../lib/muscleProgress';
import { weekdayKeyFor, WEEKDAY_LABELS } from '../lib/schedule';
import { bodyFatColor } from '../theme/theme';
import {
  classifyBodyFat,
  computeAge,
  computeBMR,
  computeBodyFat,
} from '../lib/biometrics';

/** Último peso registado (o histórico não está garantidamente ordenado). */
function getCurrentWeight(weightHistory) {
  if (!weightHistory.length) return null;
  const sorted = [...weightHistory].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  return sorted[sorted.length - 1].weight;
}

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const { data, updateData, username } = useStore();
  const [editing, setEditing] = useState(false);
  const [openMetric, setOpenMetric] = useState(null);

  const weight = useMemo(
    () => getCurrentWeight(data?.weightHistory || []),
    [data?.weightHistory],
  );
  const muscleProgress = useMemo(
    () => (data ? computeMuscleRegionProgress(data) : null),
    [data],
  );

  if (!data) return null;
  const p = data.profile;

  // Treino do dia para o hero — mesma lógica do ecrã de Treinos, para os
  // dois ecrãs nunca discordarem sobre o que está planeado para hoje.
  const todayKey = weekdayKeyFor(new Date());
  const scheduledWorkout = data.workouts.find(
    (w) => w.id === data.weeklySchedule?.[todayKey],
  );
  const hasSchedule = Object.values(data.weeklySchedule || {}).some(Boolean);
  const alreadyDoneToday =
    !!scheduledWorkout &&
    data.loggedWorkouts.some(
      (lw) => lw.date === todayLocal() && lw.workoutId === scheduledWorkout.id,
    );

  const age = p ? computeAge(p.birthdate) : null;
  const bf = p ? computeBodyFat(p.gender, p.height, p.waist, p.neck, p.hip) : null;
  const bmr = p && weight ? computeBMR(p.gender, weight, p.height, age) : null;

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginBottom: theme.space.lg,
        }}
      >
        <HeaderIcon icon="friends" onPress={() => navigation.navigate('Friends')} />
        <HeaderIcon icon="settings" onPress={() => navigation.navigate('Settings')} />
      </View>

      <HeroCard
        name={username}
        weekdayLabel={WEEKDAY_LABELS[todayKey]}
        scheduledWorkout={scheduledWorkout}
        alreadyDone={alreadyDoneToday}
        hasSchedule={hasSchedule}
        onStart={
          scheduledWorkout
            ? () => navigation.navigate('LogSession', { workoutId: scheduledWorkout.id })
            : null
        }
      />

      {!p || editing ? (
        <ProfileForm
          profile={p}
          currentWeight={weight}
          onCancel={p ? () => setEditing(false) : null}
          onSave={(profile, newWeight) => {
            updateData((prev) => {
              const today = todayLocal();
              const history = [...prev.weightHistory];
              const idx = history.findIndex((w) => w.date === today);
              if (newWeight != null) {
                if (idx >= 0) history[idx] = { date: today, weight: newWeight };
                else history.push({ date: today, weight: newWeight });
              }
              return { ...prev, profile, weightHistory: history };
            });
            setEditing(false);
          }}
        />
      ) : (
        <>
          <Card
            accent={bf != null ? bodyFatColor(bf, p.gender, theme.colors) : undefined}
            onPress={() => setOpenMetric('bodyfat')}
          >
            <CardTitle>Gordura Corporal</CardTitle>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <StatRing
                value={bf ?? '—'}
                unit={bf != null ? '%' : ''}
                percent={bf != null ? (bf / 45) * 100 : 0}
                tag={bf != null ? classifyBodyFat(bf, p.gender) : 'sem dados'}
                color={
                  bf != null ? bodyFatColor(bf, p.gender, theme.colors) : theme.colors.muted
                }
              />
            </View>
            {bf == null ? (
              <Note style={{ textAlign: 'center' }}>
                Preenche o pescoço e a cintura no perfil para veres a estimativa.
              </Note>
            ) : (
              <Note style={{ textAlign: 'center' }}>Toca para veres insights e definires uma meta.</Note>
            )}
          </Card>

          <Card>
            <CardTitle>Volume Muscular da Semana</CardTitle>
            <Note style={{ marginBottom: 10 }}>
              Cada zona fica mais intensa conforme completas as séries
              planeadas para ela esta semana. Reinicia sozinho todas as
              segundas-feiras.
            </Note>
            <BodyMuscleMap progress={muscleProgress} />
          </Card>

          <Card accent={theme.colors.info} onPress={() => setOpenMetric('bmr')}>
            <CardTitle>Metabolismo Basal</CardTitle>
            <BigStat value={bmr ?? '—'} unit="kcal / dia" color={theme.colors.info} />
            <Note style={{ marginTop: 6 }}>
              Energia que o corpo gasta em repouso. Toca para saberes mais.
            </Note>
          </Card>

          <Card accent={theme.colors.cardio}>
            <Pressable onPress={() => setOpenMetric('weight')}>
              <CardTitle>Peso Atual</CardTitle>
              <BigStat value={weight ?? '—'} unit="kg" color={theme.colors.cardio} />
              <Note style={{ marginTop: 6 }}>Toca para veres insights e definires uma meta.</Note>
            </Pressable>
          </Card>

          <Card>
            <CardTitle>Registar Peso</CardTitle>
            <WeightLogger
              onLog={(kg) =>
                updateData((prev) => {
                  const today = todayLocal();
                  const history = [...prev.weightHistory];
                  const idx = history.findIndex((w) => w.date === today);
                  if (idx >= 0) history[idx] = { date: today, weight: kg };
                  else history.push({ date: today, weight: kg });
                  return { ...prev, weightHistory: history };
                })
              }
            />
          </Card>

          <Card accent={theme.colors.gold}>
            <CardTitle
              right={
                <Button
                  title="Editar"
                  variant="ghost"
                  onPress={() => setEditing(true)}
                  style={{ paddingVertical: 6, paddingHorizontal: 14 }}
                />
              }
            >
              Perfil
            </CardTitle>
            <Body>
              {p.firstName} {p.lastName} · {age} anos
            </Body>
            <Note style={{ marginTop: 4 }}>Altura: {p.height} m</Note>
            <Note>
              Pescoço / Cintura{p.gender ? '' : ' / Anca'}: {p.neck ?? '—'} /{' '}
              {p.waist ?? '—'}
              {p.gender ? '' : ` / ${p.hip ?? '—'}`} cm
            </Note>
            <Note style={{ marginTop: 6 }}>Sessão: {username}</Note>
          </Card>

          <GoalHistoryCard goals={data.exerciseGoals || []} loggedWorkouts={data.loggedWorkouts} />
        </>
      )}

      <MetricInsightModal
        visible={!!openMetric}
        metric={openMetric}
        context={{ bf, weight, metricGoals: data.metricGoals }}
        onClose={() => setOpenMetric(null)}
        onSaveGoal={(key, goal) => {
          updateData((prev) => ({
            ...prev,
            metricGoals: { ...prev.metricGoals, [key]: goal },
          }));
          setOpenMetric(null);
        }}
      />
    </Screen>
  );
}

function HeaderIcon({ icon, onPress, badge }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={icon} size={20} color={theme.colors.textSecondary} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.accent,
          }}
        />
      ) : null}
    </Pressable>
  );
}

/** Campo rápido para registar o peso de hoje. */
function WeightLogger({ onLog }) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: theme.spacing.md }}>
      <Input
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        placeholder="Peso de hoje (kg)"
        style={{ flex: 1 }}
      />
      <Button
        title="Registar"
        variant="ghost"
        onPress={() => {
          const kg = parseFloat(value.replace(',', '.'));
          if (isNaN(kg) || kg <= 0) return;
          onLog(kg);
          setValue('');
        }}
      />
    </View>
  );
}

/** Formulário de criação/edição do perfil. */
function ProfileForm({ profile, currentWeight, onSave, onCancel }) {
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [gender, setGender] = useState(profile?.gender ?? true);
  const [birthdate, setBirthdate] = useState(profile?.birthdate || '');
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [neck, setNeck] = useState(profile?.neck ? String(profile.neck) : '');
  const [waist, setWaist] = useState(profile?.waist ? String(profile.waist) : '');
  const [hip, setHip] = useState(profile?.hip ? String(profile.hip) : '');
  const [weight, setWeight] = useState(currentWeight ? String(currentWeight) : '');
  const [takesCreatine, setTakesCreatine] = useState(profile?.takesCreatine ?? false);
  const [error, setError] = useState(null);

  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Preenche o nome.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      setError('Data de nascimento no formato AAAA-MM-DD.');
      return;
    }
    const h = num(height);
    if (!h || h < 1 || h > 2.5) {
      setError('Altura em metros (ex: 1.78).');
      return;
    }
    onSave(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthdate,
        height: h,
        neck: num(neck),
        waist: num(waist),
        // A fórmula para homens não usa a anca — não a guardamos nesse caso.
        hip: gender ? null : num(hip),
        takesCreatine,
      },
      num(weight),
    );
  }

  return (
    <Card>
      <CardTitle>{profile ? 'Editar Perfil' : 'Configurar Perfil'}</CardTitle>

      <Field label="Primeiro nome">
        <Input value={firstName} onChangeText={setFirstName} />
      </Field>
      <Field label="Último nome">
        <Input value={lastName} onChangeText={setLastName} />
      </Field>

      <Field label="Género">
        <SegmentedControl
          value={gender}
          onChange={setGender}
          options={[
            { value: true, label: 'Masculino' },
            { value: false, label: 'Feminino' },
          ]}
        />
      </Field>

      <Field label="Data de nascimento" hint="Formato AAAA-MM-DD">
        <Input
          value={birthdate}
          onChangeText={setBirthdate}
          placeholder="1998-04-25"
          keyboardType="numbers-and-punctuation"
        />
      </Field>

      <Field label="Altura (m)">
        <Input
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholder="1.78"
        />
      </Field>

      <Field label="Pescoço (cm) · opcional">
        <Input value={neck} onChangeText={setNeck} keyboardType="decimal-pad" />
      </Field>
      <Field label="Cintura (cm) · opcional">
        <Input value={waist} onChangeText={setWaist} keyboardType="decimal-pad" />
      </Field>
      {!gender ? (
        <Field label="Anca (cm) · opcional">
          <Input value={hip} onChangeText={setHip} keyboardType="decimal-pad" />
        </Field>
      ) : null}

      <Field
        label="Peso atual (kg)"
        hint="Pescoço e cintura são só necessários para a estimativa de gordura corporal."
      >
        <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      </Field>

      <Checkbox
        label="Tomo creatina"
        description="Ativa um lembrete diário e o registo de sequência na Nutrição."
        value={takesCreatine}
        onChange={setTakesCreatine}
      />

      {error ? <Body color="#C23B3B">{error}</Body> : null}

      <Button title="Guardar" variant="strength" onPress={submit} style={{ marginTop: 8 }} />
      {onCancel ? (
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={onCancel}
          style={{ marginTop: 8 }}
        />
      ) : null}
    </Card>
  );
}

/** Histórico de todos os objetivos de exercício, cumpridos ou não. */
function GoalHistoryCard({ goals, loggedWorkouts }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  if (!goals.length) return null;

  const evaluated = evaluateAllGoals(goals, loggedWorkouts).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const STATUS = {
    achieved: { label: '✅ Cumprido', color: theme.colors.good },
    missed: { label: '❌ Prazo passado', color: theme.colors.danger },
    pending: { label: '⏳ Em curso', color: theme.colors.info },
  };

  const achievedCount = evaluated.filter((g) => g.status === 'achieved').length;

  return (
    <Card>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <CardTitle>Histórico de Objetivos</CardTitle>
        <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      <Note style={{ marginTop: open ? 0 : -6, marginBottom: open ? 10 : 0 }}>
        {evaluated.length} objetivo(s) · {achievedCount} cumprido(s)
      </Note>

      {open
        ? evaluated.map((g, i) => {
            const st = STATUS[g.status];
            return (
              <View
                key={g.id}
                style={{
                  paddingVertical: 9,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.bgSoft,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Body style={{ fontFamily: theme.font.bodyBold }}>
                    {g.exerciseName} — {g.targetWeight} kg
                  </Body>
                  <Note color={st.color}>{st.label}</Note>
                </View>
                <Note>
                  {g.targetDate ? `Prazo: ${g.targetDate}` : 'Sem prazo definido'}
                  {g.achievedDate ? ` · Atingido a ${g.achievedDate}` : ''}
                </Note>
              </View>
            );
          })
        : null}
    </Card>
  );
}
