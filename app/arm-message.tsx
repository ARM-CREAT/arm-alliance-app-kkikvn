import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import BodyScrollView from '@/components/BodyScrollView';

const ARM_GREEN = '#1B5E20';
const ARM_GOLD = '#C8A84B';
const BG = '#0A1A0F';

export default function ArmMessageScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Message de l'ARM Alliance",
          headerBackTitle: 'Retour',
        }}
      />
      <BodyScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Message de l'ARM Alliance au Rassemblement Malien pour le peuple malien
        </Text>

        <View style={styles.separator} />

        <Text style={styles.body}>
          Camarades, militants, fils et filles du Mali,
        </Text>

        <Text style={styles.body}>
          L'ARM Alliance, parti politique issu d'une longue et mûre réflexion de ses fondateurs, s'adresse aujourd'hui au Rassemblement Malien, fidèle à sa vocation : servir le peuple malien et incarner l'espérance d'une démocratie véritablement enracinée dans notre terre.
        </Text>

        <Text style={styles.body}>
          Nous sommes convaincus que la démocratie ne se décrète pas par la simple copie de modèles étrangers, ni par les pratiques héritées d'un passé récent où trop de partis politiques ont confondu la course au pouvoir avec l'art de gouverner. Ces pratiques – clientélisme, culte de la personnalité, gestion opaque et déconnexion des réalités profondes de notre nation – nous les rejetons résolument.
        </Text>

        <Text style={styles.body}>
          L'ARM Alliance porte une vision claire : une démocratie authentique, moderne et digne, bâtie sur nos valeurs sociales, nos traditions et notre culture. Une démocratie qui honore la parole donnée, le respect de l'aîné, la solidarité villageoise, et qui les marie aux exigences de la gouvernance contemporaine : transparence, efficacité, justice et participation citoyenne.
        </Text>

        <Text style={styles.body}>
          Notre ambition ne s'arrête pas aux frontières du Mali. Nous nous inscrivons pleinement dans la dynamique de l'AES – Alliance des États du Sahel, convaincus que l'avenir de nos peuples passe par une souveraineté assumée, une coopération solide entre voisins sahéliens, et le refus des ingérences qui affaiblissent notre destin commun.
        </Text>

        <Text style={styles.body}>
          Aux militantes et militants du Rassemblement Malien, nous tendons la main. Ensemble, relevons le défi de refonder la politique malienne sur des bases saines, fières et résolument tournées vers l'intérêt général – non vers les intérêts particuliers.
        </Text>

        <Text style={styles.body}>
          Le Mali a soif de renouveau. L'ARM Alliance est prête à y contribuer, la tête dans les principes et les pieds dans la réalité de notre peuple.
        </Text>

        <Text style={styles.body}>
          Pour l'honneur du Mali, pour la dignité de notre démocratie, pour la force de l'AES.
        </Text>

        <View style={styles.sloganBlock}>
          <Text style={styles.slogan}>Vive l'ARM Alliance !</Text>
          <Text style={styles.slogan}>Vive le Rassemblement Malien !</Text>
          <Text style={styles.slogan}>Vive le peuple malien !</Text>
        </View>

        <View style={styles.separator} />

        <Text style={styles.footer}>
          Fait à Bamako, le 2025
        </Text>
        <Text style={styles.footer}>
          Par la coordination nationale de l'ARM Alliance
        </Text>

        <View style={{ height: 40 }} />
      </BodyScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: ARM_GOLD,
    lineHeight: 28,
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(200,168,75,0.25)',
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    color: 'rgba(232,245,238,0.92)',
    lineHeight: 26,
    marginBottom: 16,
  },
  sloganBlock: {
    marginTop: 4,
    marginBottom: 20,
    paddingLeft: 4,
  },
  slogan: {
    fontSize: 15,
    fontWeight: '700',
    color: ARM_GOLD,
    lineHeight: 26,
  },
  footer: {
    fontSize: 13,
    color: 'rgba(232,245,238,0.5)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
});
