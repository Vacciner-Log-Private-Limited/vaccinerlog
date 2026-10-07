// Travel Vaccination Requirements & Embassy Health Database
// Reference sources: CDC Travelers' Health (https://wwwnc.cdc.gov/travel) and WHO International Travel & Health

export interface VaccineRequirement {
  name: string
  matchKeywords: string[]
  type: "MANDATORY" | "RECOMMENDED" | "CONDITIONAL"
  reason: string
  details: string
}

export interface DestinationCountry {
  name: string
  code: string
  flag: string
  slug: string // CDC destination slug
  region: string
  embassyNotice: string
  vaccines: VaccineRequirement[]
  healthTips?: string[]
}

export const ORIGIN_COUNTRY = {
  name: "India",
  code: "IN",
  flag: "🇮🇳",
}

export const POPULAR_DESTINATIONS: DestinationCountry[] = [
  {
    name: "Germany",
    code: "DE",
    flag: "🇩🇪",
    slug: "germany",
    region: "Europe (Schengen)",
    embassyNotice: "German Federal Foreign Office and CDC advise travelers to be up to date on all routine immunizations. Proof of vaccination may be required for specific visas and university enrollments.",
    healthTips: [
      "Tick-Borne Encephalitis (TBE) vaccination is advised for travelers visiting forested or rural areas in southern Germany (Bavaria and Baden-Württemberg).",
      "Ensure measles immunity (MMR) is documented under the German Measles Protection Act (Masernschutzgesetz).",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "mumps", "rubella"],
        type: "RECOMMENDED",
        reason: "Mandatory under German Measles Protection Act for daycare, schools, and health facilities.",
        details: "2 doses required for full lifetime immunity.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td", "dpt"],
        type: "RECOMMENDED",
        reason: "Routine protection required every 10 years.",
        details: "Booster recommended within the last 10 years before international travel.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19", "covaxin", "covishield"],
        type: "RECOMMENDED",
        reason: "WHO / European CDC recommended for international transit.",
        details: "Completed primary series and updated seasonal boosters advised.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all unvaccinated travelers, long-term stays, and healthcare workers.",
        details: "3-dose schedule protects against bloodborne and fluid transmission.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Seasonal respiratory protection.",
        details: "Recommended annually, particularly during October to May in Europe.",
      },
      {
        name: "Tick-Borne Encephalitis (TBE)",
        matchKeywords: ["tick-borne", "tbe", "encephalitis"],
        type: "CONDITIONAL",
        reason: "Recommended if hiking, camping, or working outdoors in southern Germany (Bavaria/Baden-Württemberg).",
        details: "Transmitted by ticks in grasslands and forests from spring through autumn.",
      },
    ],
  },
  {
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    slug: "united-states",
    region: "North America",
    embassyNotice: "US Embassy & USCIS guidelines require immigrants, students, and long-term visa holders to present evidence of CDC-recommended vaccinations. Short-term visitors should ensure routine immunity.",
    healthTips: [
      "University students frequently need official documentation of MMR, Meningococcal, Hepatitis B, and Varicella before campus registration.",
      "Carry verifiable digital certificates or International Certificate of Vaccination.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "mumps", "rubella"],
        type: "RECOMMENDED",
        reason: "Standard requirement for all travelers, colleges, and immigration examinations.",
        details: "Proof of 2 lifetime doses or positive serology titer.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td", "dpt"],
        type: "RECOMMENDED",
        reason: "Protects against lockjaw and pertussis (whooping cough).",
        details: "Booster required within the last 10 years.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "CDC universally recommends for all travelers aged 0-59 years.",
        details: "3-dose primary immunization series.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19", "covaxin", "covishield"],
        type: "RECOMMENDED",
        reason: "CDC standard for international travel and medical readiness.",
        details: "Updated formulation booster recommended.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers for food and water safety.",
        details: "2 doses spaced 6 months apart for durable immunity.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Recommended annually for all individuals aged 6 months and older.",
        details: "Seasonal annual dose.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv", "opv"],
        type: "RECOMMENDED",
        reason: "Routine immunization proof for immigrants and long-term students.",
        details: "Completed childhood or adult primary series.",
      },
    ],
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    flag: "🇸🇦",
    slug: "saudi-arabia",
    region: "Middle East",
    embassyNotice: "MANDATORY EMBASSY ENTRY RULES: Saudi Ministry of Health requires mandatory Meningococcal ACWY and Polio vaccination for pilgrims (Hajj/Umrah) and seasonal workers, certified by a health authority.",
    healthTips: [
      "Meningococcal vaccine must have been administered at least 10 days before arrival and not more than 3 years (polysaccharide) or 5 years (conjugate) prior.",
      "Proof of Polio (IPV) vaccination within 12 months is mandatory for travelers arriving from polio-reporting countries.",
    ],
    vaccines: [
      {
        name: "Meningococcal (ACWY)",
        matchKeywords: ["meningococcal", "menactra", "menveo", "acwy"],
        type: "MANDATORY",
        reason: "MANDATORY entry requirement by Saudi Ministry of Health for Hajj, Umrah, and work visas.",
        details: "Quadrivalent ACWY vaccine administered ≥ 10 days prior to arrival.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv", "opv"],
        type: "MANDATORY",
        reason: "MANDATORY requirement for arrivals from polio-endemic and circulating regions.",
        details: "1 dose of IPV taken at least 4 weeks and within 12 months before entry.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "High crowd density during pilgrimage increases foodborne exposure risk.",
        details: "2 doses provide decades-long protection.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers, especially those shaving heads during pilgrimage rituals.",
        details: "Ensures bloodborne and equipment-related safety.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Protects against contaminated food and drinking water in crowded gatherings.",
        details: "Injectable conjugate vaccine or single booster.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Strongly recommended by Saudi authorities for mass gathering safety.",
        details: "Seasonal vaccine taken at least 2 weeks before arrival.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Required/strongly urged for religious pilgrimage permits via Nusuk.",
        details: "Valid primary immunization record.",
      },
    ],
  },
  {
    name: "United Kingdom",
    code: "GB",
    flag: "🇬🇧",
    slug: "united-kingdom",
    region: "Europe",
    embassyNotice: "UK Health Security Agency (UKHSA) and UK Visas and Immigration (UKVI) advise all incoming travelers and international students to be current on routine vaccinations prior to travel.",
    healthTips: [
      "International university students arriving in the UK must ensure they have received the MenACWY and 2 doses of the MMR vaccine.",
      "Tuberculosis (TB) screening certificates are required from India for visa applications over 6 months.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "mumps", "rubella"],
        type: "RECOMMENDED",
        reason: "High priority due to recurrent measles outbreaks across UK urban areas.",
        details: "2 lifetime doses advised for all travelers.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td", "dpt"],
        type: "RECOMMENDED",
        reason: "Routine tetanus and diphtheria coverage.",
        details: "Booster every 10 years.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for longer-term residents, students, and healthcare workers.",
        details: "3-dose standard course.",
      },
      {
        name: "Meningococcal (ACWY)",
        matchKeywords: ["meningococcal", "acwy", "menveo"],
        type: "RECOMMENDED",
        reason: "Required for university students entering campus housing in the UK.",
        details: "Single dose protects against strains A, C, W, and Y.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Routine protection against respiratory variants.",
        details: "Up to date with primary and booster doses.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Advised during autumn and winter travel.",
        details: "Seasonal vaccine.",
      },
    ],
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    slug: "united-arab-emirates",
    region: "Middle East",
    embassyNotice: "UAE Ministry of Health and Prevention (MOHAP) and Dubai Health Authority recommend complete routine vaccination records for visa issuance, employment permits, and school enrollment.",
    healthTips: [
      "Employment and residency visa medical screening tests for communicable diseases (HIV, TB, Hepatitis B for food/healthcare handlers).",
      "Ensure proof of Hepatitis B vaccination for hospitality, clinic, and childcare employment.",
    ],
    vaccines: [
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Mandatory screening for UAE residency employment visas in specific industries.",
        details: "Complete 3-dose series.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine protection against lockjaw.",
        details: "Booster valid within 10 years.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers for food and beverage safety.",
        details: "2 doses spaced 6 months apart.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Advised for travelers eating at varied establishments across the region.",
        details: "Single injectable dose.",
      },
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles"],
        type: "RECOMMENDED",
        reason: "Routine vaccination standard.",
        details: "2 lifetime doses.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Routine health recommendation for international travelers.",
        details: "Complete initial vaccination.",
      },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    slug: "canada",
    region: "North America",
    embassyNotice: "Public Health Agency of Canada (PHAC) and Immigration, Refugees and Citizenship Canada (IRCC) require international students and workers to have updated vaccination records.",
    healthTips: [
      "Provincial health authorities require up-to-date immunization records for school and daycare registration.",
      "Bring official records with English or French translation.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "mumps", "rubella"],
        type: "RECOMMENDED",
        reason: "Strictly required for educational institution entry and healthcare placements.",
        details: "2 documented lifetime doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Standard 10-year booster schedule.",
        details: "Tdap containing pertussis component.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Universal recommendation for travelers and incoming residents.",
        details: "3-dose course.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Recommended for travelers to prevent foodborne illness.",
        details: "2 doses.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Health Canada recommendation for respiratory protection.",
        details: "Up to date with primary series.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv"],
        type: "RECOMMENDED",
        reason: "Routine childhood/adult immunization verification.",
        details: "Completed series.",
      },
    ],
  },
  {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    slug: "australia",
    region: "Oceania",
    embassyNotice: "Australian Department of Health and Department of Home Affairs have strict biosecurity and health regulations. Yellow Fever certification is required under Australian quarantine laws if arriving from risk zones.",
    healthTips: [
      "Yellow Fever certificate is legally required if arriving within 6 days of departing a country with risk of yellow fever transmission.",
      "Japanese Encephalitis is recommended for outer islands, Torres Strait, and rural agricultural regions.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "mumps", "rubella"],
        type: "RECOMMENDED",
        reason: "Essential for all international travelers to prevent imported measles clusters.",
        details: "2 lifetime doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine 10-year booster.",
        details: "Protects against wound-acquired tetanus and pertussis.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers and visa holders.",
        details: "3-dose immunization course.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Australian health advisory.",
        details: "Up to date primary series.",
      },
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "CONDITIONAL",
        reason: "MANDATORY if arriving within 6 days of visiting or transiting (>12h) a country with yellow fever risk.",
        details: "Must be documented in the International Certificate of Vaccination (Yellow Card).",
      },
      {
        name: "Japanese Encephalitis",
        matchKeywords: ["japanese encephalitis", "je"],
        type: "CONDITIONAL",
        reason: "Recommended for long stays or outdoor rural work in northern Australia.",
        details: "Mosquito-borne viral protection.",
      },
    ],
  },
  {
    name: "Kenya",
    code: "KE",
    flag: "🇰🇪",
    slug: "kenya",
    region: "Africa",
    embassyNotice: "MANDATORY ENTRY REQUIREMENT: Proof of Yellow Fever vaccination is required by Kenyan Embassy and Ministry of Health for all travelers aged ≥ 9 months arriving from countries with risk of transmission.",
    healthTips: [
      "Yellow Fever certificate must be issued at least 10 days before arrival and provides lifetime validity.",
      "Malaria chemoprophylaxis and mosquito bite prevention are strongly advised throughout safari reserves and coastal areas.",
    ],
    vaccines: [
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "MANDATORY",
        reason: "MANDATORY certificate required at border immigration checkpoints.",
        details: "Single dose confers lifelong immunity; take ≥ 10 days before arrival.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "High risk of food and waterborne Salmonella typhi in East Africa.",
        details: "Single injectable dose.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Foodborne viral prevention essential for all travelers.",
        details: "2 doses spaced 6 months apart.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "High prevalence in local populations.",
        details: "3-dose series.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv", "opv"],
        type: "RECOMMENDED",
        reason: "CDC and WHO recommend a single lifetime adult booster for Kenya.",
        details: "Booster dose before departure.",
      },
      {
        name: "Meningococcal (ACWY)",
        matchKeywords: ["meningococcal", "acwy"],
        type: "RECOMMENDED",
        reason: "Advised during dry season (December-June) in meningitis belt areas.",
        details: "Quadrivalent conjugate vaccine.",
      },
      {
        name: "Rabies",
        matchKeywords: ["rabies"],
        type: "CONDITIONAL",
        reason: "Recommended for wildlife safari travelers, veterinarians, and remote hikers.",
        details: "Pre-exposure prophylaxis (2 or 3 doses).",
      },
      {
        name: "Cholera",
        matchKeywords: ["cholera"],
        type: "CONDITIONAL",
        reason: "Recommended for travelers visiting regions with active outbreaks.",
        details: "Oral vaccine.",
      },
    ],
  },
  {
    name: "Singapore",
    code: "SG",
    flag: "🇸🇬",
    slug: "singapore",
    region: "Southeast Asia",
    embassyNotice: "Singapore Immigration & Checkpoints Authority (ICA) strictly enforces Yellow Fever vaccination requirements for travelers arriving from or transiting endemic countries. Routine vaccines must be up to date.",
    healthTips: [
      "Strict fines apply for non-compliance with infectious disease quarantine declarations.",
      "Dengue fever is present; mosquito repellents are recommended for outdoor parks.",
    ],
    vaccines: [
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers for culinary safety.",
        details: "2 doses.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all unvaccinated individuals.",
        details: "3 doses.",
      },
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles"],
        type: "RECOMMENDED",
        reason: "Mandatory for foreign-born children applying for dependent passes in Singapore.",
        details: "2 documented doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine booster.",
        details: "Valid within 10 years.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Advised for food safety.",
        details: "Single dose.",
      },
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "CONDITIONAL",
        reason: "MANDATORY by ICA if traveling from or through a Yellow Fever risk country (>12h transit).",
        details: "Must possess valid International Certificate of Vaccination.",
      },
    ],
  },
  {
    name: "Thailand",
    code: "TH",
    flag: "🇹🇭",
    slug: "thailand",
    region: "Southeast Asia",
    embassyNotice: "Royal Thai Embassy and Department of Disease Control advise travelers to ensure immunity against tropical foodborne and mosquito-borne infections before arrival.",
    healthTips: [
      "Street food exploration is popular; Hepatitis A and Typhoid vaccines are strongly urged.",
      "Rabies is prevalent in stray dogs and monkeys at tourist temples; avoid petting wildlife.",
    ],
    vaccines: [
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "High benefit for tourists dining out and enjoying street markets.",
        details: "2 doses provide long-term protection.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Protects against Salmonella enterica via food and untreated water.",
        details: "Injectable vaccine taken ≥ 2 weeks before travel.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine protection against outdoor scratches, beach coral, and scooter falls.",
        details: "Booster within 10 years.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers, especially longer stays.",
        details: "3 doses.",
      },
      {
        name: "Japanese Encephalitis",
        matchKeywords: ["japanese encephalitis", "je"],
        type: "CONDITIONAL",
        reason: "Recommended for travelers spending > 1 month in rural/agricultural areas.",
        details: "2-dose series against mosquito-borne virus.",
      },
      {
        name: "Rabies",
        matchKeywords: ["rabies"],
        type: "CONDITIONAL",
        reason: "High risk from temple monkeys and stray domestic animals.",
        details: "Pre-exposure series simplifies emergency treatment if bitten.",
      },
    ],
  },
  {
    name: "France",
    code: "FR",
    flag: "🇫🇷",
    slug: "france",
    region: "Europe (Schengen)",
    embassyNotice: "French Ministry of Health and Schengen regulations require international travelers to adhere to routine immunization schedules. MMR and Tdap are emphasized.",
    healthTips: [
      "Ensure measles immunity is fully up to date.",
      "Carry health insurance covering travel in the Schengen area.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles"],
        type: "RECOMMENDED",
        reason: "Strict French childhood and public health immunity standard.",
        details: "2 lifetime doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Standard 10-year booster.",
        details: "Protects against wound contamination.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Universal recommendation for international travelers.",
        details: "3 doses.",
      },
      {
        name: "COVID-19",
        matchKeywords: ["covid", "covid-19"],
        type: "RECOMMENDED",
        reason: "Routine seasonal health guideline.",
        details: "Primary and booster series.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Seasonal winter protection.",
        details: "Annual dose.",
      },
    ],
  },
  {
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    slug: "japan",
    region: "East Asia",
    embassyNotice: "Embassy of Japan and Ministry of Health, Labour and Welfare (MHLW) recommend routine immunizations for travelers. Japanese Encephalitis is recommended for rural and outdoor travelers.",
    healthTips: [
      "Measles and Rubella immunity is strictly monitored in public and educational sectors.",
      "Check medication import regulations before traveling to Japan.",
    ],
    vaccines: [
      {
        name: "MMR (Measles, Mumps, Rubella)",
        matchKeywords: ["mmr", "measles", "rubella"],
        type: "RECOMMENDED",
        reason: "Japanese health authorities closely monitor rubella and measles immunity.",
        details: "2 doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine 10-year booster.",
        details: "Adult booster.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers.",
        details: "3 doses.",
      },
      {
        name: "Japanese Encephalitis",
        matchKeywords: ["japanese encephalitis", "je"],
        type: "CONDITIONAL",
        reason: "Recommended if spending extended time in rural farms or outdoor activities during summer.",
        details: "2 doses.",
      },
      {
        name: "Influenza (Flu)",
        matchKeywords: ["influenza", "flu"],
        type: "RECOMMENDED",
        reason: "Widespread during Japanese winter season.",
        details: "Annual vaccine.",
      },
    ],
  },
  {
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷",
    slug: "brazil",
    region: "South America",
    embassyNotice: "MANDATORY / HIGH-PRIORITY: Yellow Fever vaccination is strongly required by Brazilian authorities and WHO for travelers visiting almost all regions (Amazon, Iguazu, Pantanal, São Paulo, Rio).",
    healthTips: [
      "Yellow Fever certificate must be issued at least 10 days before travel.",
      "Dengue and Zika precautions: use DEET insect repellent and wear protective clothing.",
    ],
    vaccines: [
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "MANDATORY",
        reason: "MANDATORY protection advised for almost all states across Brazil.",
        details: "Single dose provides lifelong protection.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Essential food and beverage protection.",
        details: "2 doses.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Protects against bacterial contamination in food.",
        details: "Single dose.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Universal travel guideline.",
        details: "3 doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine booster.",
        details: "Valid within 10 years.",
      },
      {
        name: "Rabies",
        matchKeywords: ["rabies"],
        type: "CONDITIONAL",
        reason: "Recommended for ecotourism, spelunking, and Amazon jungle travel.",
        details: "Pre-exposure series.",
      },
    ],
  },
  {
    name: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
    slug: "south-africa",
    region: "Africa",
    embassyNotice: "South African Department of Home Affairs requires an International Yellow Fever Certificate for travelers arriving from or transiting (>12h) endemic zones.",
    healthTips: [
      "Immigration officers at OR Tambo and Cape Town international airports inspect Yellow Fever certificates upon arrival.",
      "Malaria risk exists in Kruger National Park and Lowveld areas.",
    ],
    vaccines: [
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "CONDITIONAL",
        reason: "MANDATORY if arriving from or transiting (>12h) a country with Yellow Fever risk.",
        details: "International Certificate of Vaccination required.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Protects against foodborne hepatitis.",
        details: "2 doses.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers.",
        details: "3 doses.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Advised for travelers to rural regions and smaller towns.",
        details: "Single dose.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Standard 10-year booster.",
        details: "Booster.",
      },
      {
        name: "Rabies",
        matchKeywords: ["rabies"],
        type: "CONDITIONAL",
        reason: "Recommended for safari expeditions and wildlife researchers.",
        details: "Pre-exposure course.",
      },
    ],
  },
  {
    name: "Nigeria",
    code: "NG",
    flag: "🇳🇬",
    slug: "nigeria",
    region: "Africa",
    embassyNotice: "MANDATORY ENTRY REQUIREMENT: Nigerian Immigration Service and Federal Ministry of Health require all incoming travelers to present a Yellow Fever vaccination card ('Yellow Card') upon entry.",
    healthTips: [
      "Electronic Yellow Card verification is active at major airports (Lagos and Abuja).",
      "Polio booster and Meningococcal ACWY vaccinations are strongly advised.",
    ],
    vaccines: [
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "MANDATORY",
        reason: "MANDATORY government requirement for entry at all international ports.",
        details: "Taken at least 10 days before travel.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv", "opv"],
        type: "RECOMMENDED",
        reason: "WHO recommends a 1-time adult booster dose before travel to Nigeria.",
        details: "Adult booster within 12 months.",
      },
      {
        name: "Meningococcal (ACWY)",
        matchKeywords: ["meningococcal", "acwy"],
        type: "RECOMMENDED",
        reason: "Nigeria is situated within the sub-Saharan African meningitis belt.",
        details: "Single dose quadrivalent ACWY.",
      },
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "Food and waterborne infection defense.",
        details: "2 doses.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Universal requirement.",
        details: "3 doses.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Essential for all visitors.",
        details: "Single dose.",
      },
      {
        name: "Cholera",
        matchKeywords: ["cholera"],
        type: "CONDITIONAL",
        reason: "Advised for aid workers and travelers to outbreak zones.",
        details: "Oral vaccine.",
      },
    ],
  },
  {
    name: "Egypt",
    code: "EG",
    flag: "🇪🇬",
    slug: "egypt",
    region: "Middle East / North Africa",
    embassyNotice: "Egyptian Ministry of Health requires Yellow Fever certificates for travelers arriving from or transiting through endemic areas. Polio booster is required for specific origin countries.",
    healthTips: [
      "Drink bottled water and take food hygiene precautions along the Nile valley.",
      "Check visa regulations on the official Egyptian e-visa portal.",
    ],
    vaccines: [
      {
        name: "Hepatitis A",
        matchKeywords: ["hepatitis a", "hep a"],
        type: "RECOMMENDED",
        reason: "High risk of food and water transmission.",
        details: "2 doses.",
      },
      {
        name: "Typhoid",
        matchKeywords: ["typhoid", "typbar"],
        type: "RECOMMENDED",
        reason: "Recommended for all travelers eating outside large hotels.",
        details: "Single dose.",
      },
      {
        name: "Hepatitis B",
        matchKeywords: ["hepatitis b", "hep b"],
        type: "RECOMMENDED",
        reason: "Universal recommendation.",
        details: "3 doses.",
      },
      {
        name: "Tetanus (Td/Tdap)",
        matchKeywords: ["tetanus", "tdap", "td"],
        type: "RECOMMENDED",
        reason: "Routine booster.",
        details: "Valid within 10 years.",
      },
      {
        name: "Yellow Fever",
        matchKeywords: ["yellow fever", "yf"],
        type: "CONDITIONAL",
        reason: "MANDATORY certificate required if arriving from Yellow Fever endemic territory.",
        details: "International certificate of vaccination.",
      },
      {
        name: "Polio (IPV)",
        matchKeywords: ["polio", "ipv"],
        type: "RECOMMENDED",
        reason: "Advised for travelers coming from countries reporting poliovirus strains.",
        details: "Booster dose.",
      },
    ],
  },
]

// Matches a required vaccine against a list of completed records in the user's log
export function matchVaccineWithRecords<T extends { vaccine: { name: string }; status: string }>(
  requirementKeywords: string[],
  userRecords: T[]
): { isTaken: boolean; matchedRecord?: T } {
  for (const record of userRecords) {
    if (record.status !== "COMPLETED") continue
    const recordName = record.vaccine.name.toLowerCase()

    for (const kw of requirementKeywords) {
      const kwLower = kw.toLowerCase()
      if (recordName.includes(kwLower) || kwLower.includes(recordName)) {
        return { isTaken: true, matchedRecord: record }
      }
    }
  }
  return { isTaken: false }
}

// Generate the direct CDC Travelers' Health destination URL
export function getCdcDestinationUrl(slug: string): string {
  return `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}?s_cid=ncezid-dgmq-travel-single-001`
}

export const CDC_TRAVEL_HOME = "https://wwwnc.cdc.gov/travel/"
export const CDC_MAIN_URL = "https://wwwnc.cdc.gov/"
