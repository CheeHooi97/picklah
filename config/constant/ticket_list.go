package constant

type SystemType struct {
	Key   string
	Value string
}

type RequestType struct {
	System string
	Key    string
	Value  string
}

var CompanyRequestTypes = []RequestType{
	{System: "SMiC", Key: ":T/t/reward-issue", Value: "Reward issue"},
	{System: "SMiC", Key: ":T/t/topic-stc-issue", Value: "Stc issue"},
	{System: "SMiC", Key: ":T/t/topic-u2u-issue", Value: "U2U issue"},
	{System: "SMiC", Key: ":T/t/topic-matrix-issue", Value: "Matrix issue"},
	{System: "SMiC", Key: ":T/t/topic-mtl-issue", Value: "Ferris Wheel issue"},
	{System: "SMiC", Key: ":T/t/topic-account-issue", Value: "Account issue"},
	{System: "SMiC", Key: ":T/t/topic-phone-issue", Value: "Phone issue"},
	{System: "SMiC", Key: ":T/t/topic-token-issue", Value: "Token issue"},
	{System: "SMiC", Key: ":T/t/topic-others", Value: "Others"},
	{System: "Mi Academy", Key: ":T/t/topic-course-information", Value: "Course information"},
	{System: "Mi Academy", Key: ":T/t/topic-registration-method", Value: "Registration method"},
	{System: "Mi Academy", Key: ":T/t/topic-trainer-assistant-system", Value: "Trainee Assistant System"},
	{System: "Mi Academy", Key: ":T/t/topic-others", Value: "Others"},
	{System: "Eco Mall", Key: ":T/t/topic-account-issue", Value: "Account issue"},
	{System: "Eco Mall", Key: ":T/t/topic-order-issue", Value: "Order issue"},
	{System: "Eco Mall", Key: ":T/t/topic-wallet-issue", Value: "Wallet issue"},
	{System: "Eco Mall", Key: ":T/t/topic-payment-issue", Value: "Payment issue"},
	{System: "Eco Mall", Key: ":T/t/topic-rental-issue", Value: "Rental issue"},
	{System: "Eco Mall", Key: ":T/t/topic-general-issue", Value: "General issue"},
}

var SystemTypes = []SystemType{
	{Key: ":T/t/smic", Value: "SMiC"},
	{Key: ":T/t/mi-academy", Value: "Mi Academy"},
	{Key: ":T/t/eco-mall", Value: "Eco Mall"},
}
