
import React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView,
  Platform
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function IdeologyScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Idéologie du Parti",
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.headerCard}>
            <Text style={styles.mainTitle}>Alliance pour le Rassemblement Malien</Text>
            <Text style={styles.subtitle}>Une vision, une force, une mission</Text>
          </View>
        </View>

        {/* DISCOURS OFFICIEL DU PRÉSIDENT SUR L'AES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="megaphone.fill" 
              android_material_icon_name="campaign" 
              size={24} 
              color={colors.accent} 
            />
            <Text style={styles.sectionTitle}>Discours Officiel du Président</Text>
          </View>
          
          <View style={styles.speechCard}>
            <Text style={styles.speechSubtitle}>Sur l&apos;Alliance des États du Sahel (AES)</Text>
            
            <View style={styles.speechIntro}>
              <Text style={styles.speechIntroText}>Chers compatriotes,</Text>
              <Text style={styles.speechIntroText}>Chers militants et militantes de l&apos;Alliance pour le Rassemblement Malien,</Text>
              <Text style={styles.speechIntroText}>Honorables invités,</Text>
              <Text style={styles.speechIntroText}>Frères et sœurs du Sahel,</Text>
            </View>

            <Text style={styles.speechText}>
              Aujourd&apos;hui, je m&apos;adresse à vous à un moment décisif de l&apos;histoire de notre pays et de notre région. Le Mali, le Burkina Faso et le Niger ont fait un choix courageux : celui de la dignité, de la souveraineté et de la solidarité active entre peuples frères. Ce choix s&apos;incarne désormais dans une réalité politique et stratégique majeure : l&apos;Alliance des États du Sahel, l&apos;AES.
            </Text>

            <View style={styles.speechHighlight}>
              <Text style={styles.speechHighlightText}>L&apos;AES n&apos;est pas un slogan.</Text>
              <Text style={styles.speechHighlightText}>L&apos;AES n&apos;est pas une simple organisation de plus.</Text>
              <Text style={styles.speechHighlightText}>L&apos;AES est une réponse historique à des décennies de dépendance, d&apos;insécurité imposée et de modèles de développement inadaptés à nos réalités.</Text>
            </View>

            {/* 1. La vision de l'ARM sur l'AES */}
            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>1.</Text>
                <Text style={styles.speechSectionTitle}>La vision de l&apos;ARM sur l&apos;AES</Text>
              </View>
              <Text style={styles.speechText}>
                L&apos;Alliance pour le Rassemblement Malien salue la création et la consolidation de l&apos;AES comme un acte de souveraineté collective. L&apos;ARM considère l&apos;AES comme un cadre stratégique déjà structuré, doté :
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>de mécanismes de coordination politique,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>de dispositifs de sécurité collective,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>d&apos;outils économiques et financiers, notamment la Banque d&apos;Investissement de l&apos;AES.</Text>
                </View>
              </View>
              <Text style={styles.speechText}>
                Notre rôle, en tant que parti politique responsable, n&apos;est pas de réinventer l&apos;AES, mais de l&apos;accompagner, de l&apos;enraciner et de l&apos;intégrer intelligemment dans les politiques nationales du Mali.
              </Text>
            </View>

            {/* 2. L'engagement clair de l'ARM */}
            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>2.</Text>
                <Text style={styles.speechSectionTitle}>L&apos;engagement clair de l&apos;ARM</Text>
              </View>
              <Text style={styles.speechText}>
                L&apos;ARM s&apos;engage, sans ambiguïté, à :
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Aligner les politiques publiques nationales sur les orientations de l&apos;AES, dans le respect de la souveraineté du Mali ;</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Renforcer la coopération sécuritaire, car la sécurité du Mali est indissociable de celle du Burkina Faso et du Niger ;</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Mobiliser pleinement les instruments économiques de l&apos;AES, pour financer les infrastructures, l&apos;agriculture, l&apos;industrialisation et l&apos;emploi des jeunes ;</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Faire de l&apos;intégration sahélienne une réalité concrète pour les populations, et non un projet réservé aux institutions.</Text>
                </View>
              </View>
              <Text style={styles.speechTextBold}>
                L&apos;AES doit être visible dans la vie quotidienne des citoyens :
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>dans les routes,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>dans l&apos;énergie,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>dans l&apos;emploi,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>dans la sécurité alimentaire,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>dans la dignité retrouvée.</Text>
                </View>
              </View>
            </View>

            {/* 3. AES et développement économique */}
            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>3.</Text>
                <Text style={styles.speechSectionTitle}>AES et développement économique</Text>
              </View>
              <Text style={styles.speechText}>
                L&apos;ARM affirme que le développement économique du Mali passera par l&apos;espace AES.
              </Text>
              <Text style={styles.speechText}>
                Nous croyons à :
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>la transformation locale de nos ressources,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>la souveraineté alimentaire,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>la création de chaînes de valeur régionales,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>l&apos;investissement productif plutôt que l&apos;endettement stérile.</Text>
                </View>
              </View>
              <Text style={styles.speechText}>
                La Banque d&apos;Investissement de l&apos;AES doit devenir un levier central du développement sahélien, au service des peuples, et non des intérêts privés ou étrangers.
              </Text>
            </View>

            {/* 4. AES et gouvernance intègre */}
            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionNumber}>4.</Text>
                <Text style={styles.speechSectionTitle}>AES et gouvernance intègre</Text>
              </View>
              <Text style={styles.speechText}>
                Chers compatriotes,
              </Text>
              <Text style={styles.speechText}>
                Aucune intégration régionale ne peut réussir sans une gouvernance exemplaire.
              </Text>
              <Text style={styles.speechText}>
                C&apos;est pourquoi l&apos;ARM lie indissociablement l&apos;accompagnement de l&apos;AES à une lutte ferme contre la corruption.
              </Text>
              <Text style={styles.speechTextBold}>
                Nous disons clairement :
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>pas de développement sans transparence,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>pas de souveraineté sans responsabilité,</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>pas de progrès durable sans justice et redevabilité.</Text>
                </View>
              </View>
              <Text style={styles.speechText}>
                Tous les projets liés à l&apos;AES devront être protégés contre la corruption, le détournement et l&apos;impunité. L&apos;argent public doit servir le peuple, rien d&apos;autre.
              </Text>
            </View>

            {/* Message aux peuples du Sahel */}
            <View style={styles.speechSection}>
              <View style={styles.speechSectionHeader}>
                <Text style={styles.speechSectionTitle}>Message aux peuples du Sahel</Text>
              </View>
              <View style={styles.speechFinalMessage}>
                <Text style={styles.speechFinalText}>Notre destin est lié.</Text>
                <Text style={styles.speechFinalText}>Nos combats sont communs.</Text>
                <Text style={styles.speechFinalText}>Nos victoires seront partagées.</Text>
              </View>
              <Text style={styles.speechText}>
                L&apos;AES est une alliance d&apos;États, mais surtout une alliance de peuples.
              </Text>
              <Text style={styles.speechText}>
                L&apos;Alliance pour le Rassemblement Malien fait le choix de l&apos;histoire, pas de la facilité.
              </Text>
              <Text style={styles.speechTextBold}>
                Nous faisons le choix de l&apos;unité sahélienne.
              </Text>
            </View>
          </View>
        </View>

        {/* Fondements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>Fondements de l&apos;idéologie</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              L&apos;Alliance pour le Rassemblement Malien est un mouvement politique qui puise sa légitimité et sa vision dans les réalités profondes du peuple malien.
            </Text>
            <Text style={styles.bodyText}>
              Son idéologie repose sur trois piliers fondamentaux : la fraternité, la liberté et l&apos;égalité, qui ne sont pas de simples slogans, mais des engagements concrets pour bâtir une société plus juste, plus unie, et plus digne.
            </Text>
          </View>
        </View>

        {/* Les trois piliers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="flag.fill" 
              android_material_icon_name="flag" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>Les Trois Piliers</Text>
          </View>
          
          <View style={styles.pillarCard}>
            <View style={styles.pillarHeader}>
              <IconSymbol 
                ios_icon_name="heart.fill" 
                android_material_icon_name="favorite" 
                size={28} 
                color={colors.accent} 
              />
              <Text style={styles.pillarTitle}>Fraternité</Text>
            </View>
            <Text style={styles.pillarText}>
              Rassembler le peuple malien au-delà des appartenances ethniques, religieuses ou régionales. A.R.M croit en un Mali réconcilié avec lui-même, où l&apos;unité nationale surpasse les divisions.
            </Text>
          </View>

          <View style={styles.pillarCard}>
            <View style={styles.pillarHeader}>
              <IconSymbol 
                ios_icon_name="hand.raised.fill" 
                android_material_icon_name="front-hand" 
                size={28} 
                color={colors.accent} 
              />
              <Text style={styles.pillarTitle}>Liberté</Text>
            </View>
            <Text style={styles.pillarText}>
              Défendre l&apos;État de droit, la démocratie participative, la transparence et l&apos;alternance. Le parti se veut la voix des silencieux, le bras des laissés-pour-compte.
            </Text>
          </View>

          <View style={styles.pillarCard}>
            <View style={styles.pillarHeader}>
              <IconSymbol 
                ios_icon_name="equal.circle.fill" 
                android_material_icon_name="balance" 
                size={28} 
                color={colors.accent} 
              />
              <Text style={styles.pillarTitle}>Égalité</Text>
            </View>
            <Text style={styles.pillarText}>
              Garantir la justice sociale pour tous. Le cœur de ceux qui aspirent à une vie meilleure dans la paix, la dignité, et le progrès.
            </Text>
          </View>
        </View>

        {/* Idéologie enracinée */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="leaf.fill" 
              android_material_icon_name="eco" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>Enracinée dans la société malienne</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              A.R.M est un parti qui comprend le quotidien des Maliens, car il part du terrain, des villages, des quartiers populaires, des marchés, des champs, des écoles et des dispensaires.
            </Text>
            <Text style={styles.bodyText}>
              L&apos;idéologie du parti est donc sociale, réaliste et inclusive.
            </Text>
          </View>
        </View>

        {/* Caractéristiques */}
        <View style={styles.section}>
          <View style={styles.characteristicCard}>
            <View style={styles.characteristicHeader}>
              <IconSymbol 
                ios_icon_name="person.3.fill" 
                android_material_icon_name="group" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.characteristicTitle}>Sociale</Text>
            </View>
            <Text style={styles.characteristicText}>
              Parce qu&apos;elle place l&apos;humain avant tout : santé, éducation, logement, sécurité alimentaire et justice sociale.
            </Text>
          </View>

          <View style={styles.characteristicCard}>
            <View style={styles.characteristicHeader}>
              <IconSymbol 
                ios_icon_name="building.columns.fill" 
                android_material_icon_name="account-balance" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.characteristicTitle}>Républicaine</Text>
            </View>
            <Text style={styles.characteristicText}>
              Car elle défend l&apos;État de droit, la démocratie participative, la transparence et l&apos;alternance.
            </Text>
          </View>

          <View style={styles.characteristicCard}>
            <View style={styles.characteristicHeader}>
              <IconSymbol 
                ios_icon_name="flag.fill" 
                android_material_icon_name="flag" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.characteristicTitle}>Patriotique</Text>
            </View>
            <Text style={styles.characteristicText}>
              Car elle met en avant l&apos;indépendance du pays, la souveraineté nationale, la valorisation des cultures maliennes et la protection des ressources naturelles.
            </Text>
          </View>
        </View>

        {/* Priorités */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="list.bullet" 
              android_material_icon_name="list" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>Grandes Priorités</Text>
          </View>
          
          <View style={styles.priorityCard}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>1</Text>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>Rassembler</Text>
              <Text style={styles.priorityText}>
                Rassembler le peuple malien au-delà des appartenances ethniques, religieuses ou régionales.
              </Text>
            </View>
          </View>

          <View style={styles.priorityCard}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>2</Text>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>Refonder l&apos;État</Text>
              <Text style={styles.priorityText}>
                Refonder l&apos;État malien en le rendant plus proche du peuple, plus efficace, moins corrompu. Numériser l&apos;administration pour plus de transparence et d&apos;efficacité.
              </Text>
            </View>
          </View>

          <View style={styles.priorityCard}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>3</Text>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>Éduquer pour libérer</Text>
              <Text style={styles.priorityText}>
                L&apos;école est l&apos;arme la plus puissante pour briser les chaînes de la pauvreté et de l&apos;ignorance.
              </Text>
            </View>
          </View>

          <View style={styles.priorityCard}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>4</Text>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>Créer des opportunités</Text>
              <Text style={styles.priorityText}>
                Créer des opportunités économiques locales pour lutter contre l&apos;exode rural, le chômage des jeunes et la dépendance extérieure.
              </Text>
            </View>
          </View>

          <View style={styles.priorityCard}>
            <View style={styles.priorityNumber}>
              <Text style={styles.priorityNumberText}>5</Text>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>Bâtir la paix</Text>
              <Text style={styles.priorityText}>
                Bâtir une paix durable, enracinée dans la justice, le dialogue intercommunautaire et le respect mutuel.
              </Text>
            </View>
          </View>
        </View>

        {/* Vision moderne */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="arrow.forward.circle.fill" 
              android_material_icon_name="arrow-forward" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>Une idéologie en mouvement</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              A.R.M n&apos;est pas un parti figé dans le passé : c&apos;est un mouvement innovant, ambitieux, moderne, qui intègre les outils numériques, la jeunesse, la diaspora et les femmes dans tous ses processus de réflexion et de décision.
            </Text>
            <Text style={styles.bodyText}>
              Le parti se voit comme un levier de transformation sociale, un artisan du progrès local, et un bâtisseur d&apos;un Mali fort dans une Afrique forte.
            </Text>
          </View>
        </View>

        {/* Conclusion */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol 
              ios_icon_name="heart.circle.fill" 
              android_material_icon_name="favorite" 
              size={24} 
              color={colors.accent} 
            />
            <Text style={styles.sectionTitle}>Le sens profond du rassemblement</Text>
          </View>
          <View style={styles.conclusionCard}>
            <Text style={styles.conclusionText}>
              L&apos;Alliance pour le Rassemblement Malien est née d&apos;un cri du cœur : celui de tout un peuple qui aspire à être entendu, respecté et servi.
            </Text>
            <Text style={styles.conclusionText}>
              Ce n&apos;est pas un parti de promesses électorales, mais un projet de société structuré, fondé sur les valeurs maliennes les plus nobles : le respect, le courage, la solidarité, et le sens du sacrifice collectif.
            </Text>
            <Text style={styles.conclusionHighlight}>
              A.R.M n&apos;est pas seulement un nom. C&apos;est une vision, une force, une mission.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  headerCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  
  // Speech styles
  speechCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 6,
    borderLeftColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  speechSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  speechIntro: {
    marginBottom: 20,
  },
  speechIntroText: {
    fontSize: 15,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  speechText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 16,
    textAlign: 'justify',
  },
  speechTextBold: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  speechHighlight: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  speechHighlightText: {
    fontSize: 16,
    color: colors.background,
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '600',
  },
  speechSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  speechSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  speechSectionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  speechSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },
  speechFinalMessage: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  speechFinalText: {
    fontSize: 17,
    color: colors.background,
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  pillarCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  pillarText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  characteristicCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characteristicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  characteristicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  characteristicText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  priorityCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  priorityNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  priorityText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  conclusionCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conclusionText: {
    fontSize: 16,
    color: colors.background,
    lineHeight: 24,
    marginBottom: 16,
  },
  conclusionHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
});
