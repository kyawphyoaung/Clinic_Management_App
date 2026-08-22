-- Map ISO country codes to full English country names on patients and agents.

-- Patients: nationality
UPDATE patients SET nationality = 'Myanmar' WHERE nationality = 'MM';
UPDATE patients SET nationality = 'Taiwan' WHERE nationality = 'TW';
UPDATE patients SET nationality = 'United States' WHERE nationality = 'US';
UPDATE patients SET nationality = 'Japan' WHERE nationality = 'JP';
UPDATE patients SET nationality = 'South Korea' WHERE nationality = 'KR';
UPDATE patients SET nationality = 'Singapore' WHERE nationality = 'SG';
UPDATE patients SET nationality = 'Malaysia' WHERE nationality = 'MY';
UPDATE patients SET nationality = 'Thailand' WHERE nationality = 'TH';
UPDATE patients SET nationality = 'Vietnam' WHERE nationality = 'VN';
UPDATE patients SET nationality = 'Philippines' WHERE nationality = 'PH';
UPDATE patients SET nationality = 'China' WHERE nationality = 'CN';
UPDATE patients SET nationality = 'Hong Kong' WHERE nationality = 'HK';
UPDATE patients SET nationality = 'Australia' WHERE nationality = 'AU';
UPDATE patients SET nationality = 'United Kingdom' WHERE nationality = 'GB';
UPDATE patients SET nationality = 'Other' WHERE nationality = 'OTHER';

-- Patients: country_of_residence
UPDATE patients SET country_of_residence = 'Myanmar' WHERE country_of_residence = 'MM';
UPDATE patients SET country_of_residence = 'Taiwan' WHERE country_of_residence = 'TW';
UPDATE patients SET country_of_residence = 'United States' WHERE country_of_residence = 'US';
UPDATE patients SET country_of_residence = 'Japan' WHERE country_of_residence = 'JP';
UPDATE patients SET country_of_residence = 'South Korea' WHERE country_of_residence = 'KR';
UPDATE patients SET country_of_residence = 'Singapore' WHERE country_of_residence = 'SG';
UPDATE patients SET country_of_residence = 'Malaysia' WHERE country_of_residence = 'MY';
UPDATE patients SET country_of_residence = 'Thailand' WHERE country_of_residence = 'TH';
UPDATE patients SET country_of_residence = 'Vietnam' WHERE country_of_residence = 'VN';
UPDATE patients SET country_of_residence = 'Philippines' WHERE country_of_residence = 'PH';
UPDATE patients SET country_of_residence = 'China' WHERE country_of_residence = 'CN';
UPDATE patients SET country_of_residence = 'Hong Kong' WHERE country_of_residence = 'HK';
UPDATE patients SET country_of_residence = 'Australia' WHERE country_of_residence = 'AU';
UPDATE patients SET country_of_residence = 'United Kingdom' WHERE country_of_residence = 'GB';
UPDATE patients SET country_of_residence = 'Other' WHERE country_of_residence = 'OTHER';

-- Patients: physician_country (same code set used in registration)
UPDATE patients SET physician_country = 'Myanmar' WHERE physician_country = 'MM';
UPDATE patients SET physician_country = 'Taiwan' WHERE physician_country = 'TW';
UPDATE patients SET physician_country = 'United States' WHERE physician_country = 'US';
UPDATE patients SET physician_country = 'Japan' WHERE physician_country = 'JP';
UPDATE patients SET physician_country = 'South Korea' WHERE physician_country = 'KR';
UPDATE patients SET physician_country = 'Singapore' WHERE physician_country = 'SG';
UPDATE patients SET physician_country = 'Malaysia' WHERE physician_country = 'MY';
UPDATE patients SET physician_country = 'Thailand' WHERE physician_country = 'TH';
UPDATE patients SET physician_country = 'Vietnam' WHERE physician_country = 'VN';
UPDATE patients SET physician_country = 'Philippines' WHERE physician_country = 'PH';
UPDATE patients SET physician_country = 'China' WHERE physician_country = 'CN';
UPDATE patients SET physician_country = 'Hong Kong' WHERE physician_country = 'HK';
UPDATE patients SET physician_country = 'Australia' WHERE physician_country = 'AU';
UPDATE patients SET physician_country = 'United Kingdom' WHERE physician_country = 'GB';
UPDATE patients SET physician_country = 'Other' WHERE physician_country = 'OTHER';

-- Agents: country_of_residence
UPDATE agents SET country_of_residence = 'Myanmar' WHERE country_of_residence = 'MM';
UPDATE agents SET country_of_residence = 'Taiwan' WHERE country_of_residence = 'TW';
UPDATE agents SET country_of_residence = 'United States' WHERE country_of_residence = 'US';
UPDATE agents SET country_of_residence = 'Japan' WHERE country_of_residence = 'JP';
UPDATE agents SET country_of_residence = 'South Korea' WHERE country_of_residence = 'KR';
UPDATE agents SET country_of_residence = 'Singapore' WHERE country_of_residence = 'SG';
UPDATE agents SET country_of_residence = 'Malaysia' WHERE country_of_residence = 'MY';
UPDATE agents SET country_of_residence = 'Thailand' WHERE country_of_residence = 'TH';
UPDATE agents SET country_of_residence = 'Vietnam' WHERE country_of_residence = 'VN';
UPDATE agents SET country_of_residence = 'Philippines' WHERE country_of_residence = 'PH';
UPDATE agents SET country_of_residence = 'China' WHERE country_of_residence = 'CN';
UPDATE agents SET country_of_residence = 'Hong Kong' WHERE country_of_residence = 'HK';
UPDATE agents SET country_of_residence = 'Australia' WHERE country_of_residence = 'AU';
UPDATE agents SET country_of_residence = 'United Kingdom' WHERE country_of_residence = 'GB';
UPDATE agents SET country_of_residence = 'Indonesia' WHERE country_of_residence = 'ID';
UPDATE agents SET country_of_residence = 'India' WHERE country_of_residence = 'IN';
UPDATE agents SET country_of_residence = 'Canada' WHERE country_of_residence = 'CA';
UPDATE agents SET country_of_residence = 'United Arab Emirates' WHERE country_of_residence = 'AE';
UPDATE agents SET country_of_residence = 'Other' WHERE country_of_residence = 'OTHER';

-- Agents: patient_origin_countries (text[])
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'MM', 'Myanmar');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'TW', 'Taiwan');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'US', 'United States');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'JP', 'Japan');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'KR', 'South Korea');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'SG', 'Singapore');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'MY', 'Malaysia');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'TH', 'Thailand');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'VN', 'Vietnam');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'PH', 'Philippines');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'CN', 'China');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'HK', 'Hong Kong');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'AU', 'Australia');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'GB', 'United Kingdom');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'ID', 'Indonesia');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'IN', 'India');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'CA', 'Canada');
UPDATE agents SET patient_origin_countries = array_replace(patient_origin_countries, 'OTHER', 'Other');
